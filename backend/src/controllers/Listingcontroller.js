import { CropListing } from '../models/croplisting.js'
import { uploadMultipleToCloudinary } from '../utils/cloudinary.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// ─────────────────────────────────────────────────────────────────────────────
//  createListing
//  POST /api/listings
//  Access: farmer only (authMiddleware + roleMiddleware('farmer') in route)
//
//  Flow:
//    1. multer puts the file in req.file.buffer (handled in route, not here)
//    2. upload buffer → Cloudinary → get back secure_url
//    3. save listing with farmer = req.user._id
// ─────────────────────────────────────────────────────────────────────────────
const createListing = asyncHandler(async (req, res) => {
  const {
    cropName,
    category,
    quantity,
    minOrderQty,
    pricePerKg,
    harvestDate,
    description,
    state,
    district,
    taluka,
    village,
    grade,
    perishability,
    farmerDelivers,
    buyerPickup,
    platformTransporter,
    priceIncludesDelivery,
    deliveryCharge,
    additionalDeliveryCharge,
  } = req.body

  // Required field guard — model validation will also catch this,
  // but failing fast here gives a cleaner 400 before any DB call
  if (!cropName || !quantity || !pricePerKg) {
    throw new ApiError(400, 'cropName, quantity, and pricePerKg are required')
  }

  const parseBool = (val) => val === 'true' || val === true

  const images = req.files?.length
    ? await uploadMultipleToCloudinary(req.files.map((f) => f.buffer))
    : []

  const listing = await CropListing.create({
    farmer:      req.user._id,          // injected by authMiddleware
    cropName,
    category,
    quantity:    Number(quantity),
    availableQty: Number(quantity),
    minOrderQty: Number(minOrderQty) || 1,
    pricePerKg:  Number(pricePerKg),
    harvestDate: harvestDate || undefined,
    description: description || '',
    quality: {
      grade:        grade        || 'A',
      perishability: perishability || 'medium',
    },
    delivery: {
      farmerDelivers:           parseBool(farmerDelivers),
      buyerPickup:              parseBool(buyerPickup),
      platformTransporter:      parseBool(platformTransporter),
      priceIncludesDelivery:    parseBool(priceIncludesDelivery),
      additionalDeliveryCharge: Number(additionalDeliveryCharge ?? deliveryCharge) || 0,
    },
    location: {
      state:    state    || '',
      district: district || '',
      taluka:   taluka   || '',
      village:  village  || '',
    },
    images,
    imageUploadedAt: images.length ? new Date() : undefined,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, listing, 'Listing created successfully'))
})

// ─────────────────────────────────────────────────────────────────────────────
//  getAllListings
//  GET /api/listings?crop=&state=&minPrice=&maxPrice=
//  Access: public — no auth required
//
//  Rules:
//    - ONLY isAvailable: true listings (marketplace must never show deleted)
//    - cropName is a case-insensitive regex (partial match: "whe" matches "Wheat")
//    - minPrice / maxPrice filter on pricePerKg
//    - populate farmer → name, phone, location only (never password/email)
// ─────────────────────────────────────────────────────────────────────────────
const getAllListings = asyncHandler(async (req, res) => {
  const {
    crop,
    state,
    minPrice,
    maxPrice,
    grade,
    perishability,
    deliveryMethod,
  } = req.query

  const filter = { isAvailable: true }

  if (crop) {
    // Case-insensitive partial match so buyers can search "tom" and get "Tomato"
    filter.cropName = { $regex: escapeRegex(crop.trim()), $options: 'i' }
  }

  if (state) {
    filter['location.state'] = { $regex: escapeRegex(state.trim()), $options: 'i' }
  }

  const min = Number(minPrice)
  const max = Number(maxPrice)
  const hasMin = Number.isFinite(min)
  const hasMax = Number.isFinite(max)

  if (hasMin || hasMax) {
    filter.pricePerKg = {}
    if (hasMin) filter.pricePerKg.$gte = min
    if (hasMax) filter.pricePerKg.$lte = max
  }

  if (grade) {
    filter['quality.grade'] = grade
  }

  if (perishability) {
    filter['quality.perishability'] = perishability
  }

  if (deliveryMethod) {
    if (deliveryMethod === 'farmer_delivers') {
      filter['delivery.farmerDelivers'] = true
    } else if (deliveryMethod === 'buyer_pickup') {
      filter['delivery.buyerPickup'] = true
    } else if (deliveryMethod === 'platform_transporter') {
      filter['delivery.platformTransporter'] = true
    }
  }

  filter.expiryDate = { $gt: new Date() }

  const listings = await CropListing.find(filter)
    .populate('farmer', 'name phone location')   // never expose password/email
    .sort({ createdAt: -1 })                      // newest listings first

  return res
    .status(200)
    .json(new ApiResponse(200, listings, 'Listings fetched successfully'))
})

// ─────────────────────────────────────────────────────────────────────────────
//  getMyListings
//  GET /api/listings/my
//  Access: farmer only
//
//  Returns ALL listings for this farmer — including isAvailable: false ones
//  so the farmer can see their full history in their dashboard.
// ─────────────────────────────────────────────────────────────────────────────
const getMyListings = asyncHandler(async (req, res) => {
  const listings = await CropListing.find({ farmer: req.user._id })
    .sort({ createdAt: -1 })

  return res
    .status(200)
    .json(new ApiResponse(200, listings, 'Your listings fetched successfully'))
})

// ─────────────────────────────────────────────────────────────────────────────
//  getSingleListing
//  GET /api/listings/:id
//  Access: public
// ─────────────────────────────────────────────────────────────────────────────
const getSingleListing = asyncHandler(async (req, res) => {
  const { id } = req.params

  await CropListing.findByIdAndUpdate(id, { $inc: { viewCount: 1 } })

  const listing = await CropListing.findById(id)
    .populate('farmer', 'name phone location')

  if (!listing) {
    throw new ApiError(404, 'Listing not found')
  }

  return res
    .status(200)
    .json(new ApiResponse(200, listing, 'Listing fetched successfully'))
})

// ─────────────────────────────────────────────────────────────────────────────
//  updateListing
//  PUT /api/listings/:id
//  Access: farmer only + must own the listing
//
//  Rules:
//    - Ownership check BEFORE any update
//    - If a new image is in req.file, re-upload and overwrite imageUrl
//    - Only update fields that were actually sent (spread pattern)
// ─────────────────────────────────────────────────────────────────────────────
const updateListing = asyncHandler(async (req, res) => {
  const listing = await CropListing.findById(req.params.id)

  if (!listing) {
    throw new ApiError(404, 'Listing not found')
  }

  // ── Ownership check ──────────────────────────────────────
  // Both sides must be strings for strict equality to work —
  // ObjectId !== string without .toString()
  if (listing.farmer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this listing')
  }

  if (req.files?.length) {
    const images = await uploadMultipleToCloudinary(
      req.files.map((f) => f.buffer)
    )
    if (images.length) {
      listing.images = images
      listing.imageUploadedAt = new Date()
    }
  }

  // ── Apply only the fields that were actually sent ────────
  const {
    cropName,
    category,
    quantity,
    minOrderQty,
    pricePerKg,
    harvestDate,
    description,
    state,
    district,
    taluka,
    village,
    grade,
    perishability,
    farmerDelivers,
    buyerPickup,
    platformTransporter,
    priceIncludesDelivery,
    deliveryCharge,
    additionalDeliveryCharge,
  } = req.body

  const parseBool = (val) => val === 'true' || val === true

  if (cropName    !== undefined) listing.cropName    = cropName
  if (category    !== undefined) listing.category    = category
  if (quantity    !== undefined) { listing.quantity = Number(quantity); listing.availableQty = Number(quantity) }
  if (minOrderQty !== undefined) listing.minOrderQty = Number(minOrderQty)
  if (pricePerKg  !== undefined) listing.pricePerKg  = Number(pricePerKg)
  if (harvestDate !== undefined) listing.harvestDate = harvestDate
  if (description !== undefined) listing.description = description

  // Quality subdocument
  if (grade         !== undefined) listing.quality.grade         = grade
  if (perishability !== undefined) listing.quality.perishability = perishability

  // Delivery subdocument
  if (farmerDelivers      !== undefined) listing.delivery.farmerDelivers      = parseBool(farmerDelivers)
  if (buyerPickup         !== undefined) listing.delivery.buyerPickup         = parseBool(buyerPickup)
  if (platformTransporter !== undefined) listing.delivery.platformTransporter = parseBool(platformTransporter)
  if (priceIncludesDelivery !== undefined) listing.delivery.priceIncludesDelivery = parseBool(priceIncludesDelivery)
  if (deliveryCharge !== undefined || additionalDeliveryCharge !== undefined) {
    listing.delivery.additionalDeliveryCharge = Number(additionalDeliveryCharge ?? deliveryCharge)
  }

  // Nested location fields — update individually so a partial
  // location update doesn't wipe the other field
  if (state    !== undefined) listing.location.state    = state
  if (district !== undefined) listing.location.district = district
  if (taluka   !== undefined) listing.location.taluka   = taluka
  if (village  !== undefined) listing.location.village  = village

  const updatedListing = await listing.save()

  return res
    .status(200)
    .json(new ApiResponse(200, updatedListing, 'Listing updated successfully'))
})

// ─────────────────────────────────────────────────────────────────────────────
//  deleteListing
//  DELETE /api/listings/:id
//  Access: farmer only + must own the listing
//
//  SOFT DELETE ONLY — sets isAvailable: false
//  The document stays in MongoDB for order history and audit purposes.
// ─────────────────────────────────────────────────────────────────────────────
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await CropListing.findById(req.params.id)

  if (!listing) {
    throw new ApiError(404, 'Listing not found')
  }

  // ── Ownership check ──────────────────────────────────────
  if (listing.farmer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this listing')
  }

  listing.isAvailable = false
  await listing.save()

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Listing removed from marketplace'))
})

export {
  createListing,
  getAllListings,
  getMyListings,
  getSingleListing,
  updateListing,
  deleteListing,
}
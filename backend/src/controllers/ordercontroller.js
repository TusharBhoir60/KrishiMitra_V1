import { Order } from '../models/order.js'
import { CropListing } from '../models/croplisting.js'
import { User } from '../models/user.model.js'
import Transporter from '../models/Transporter.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { calculateDelivery } from '../services/deliveryService.js'
import {
  notifyNewOrderRequest,
  notifyOrderAccepted,
  notifyOrderDeclined,
  notifyOrderExpired,
  notifyOrderDispatched,
  notifyOrderInTransit,
  notifyOrderDelivered,
  notifyPaymentReleased,
  notifyDisputeRaised,
  notifyTransporterAssigned,
} from '../services/notificationService.js'
import { generateOTP, verifyOTP } from '../services/otpService.js'
import { uploadMultipleToCloudinary } from '../utils/cloudinary.js'

const placeOrder = asyncHandler(async (req, res) => {
  const { cropListingId, quantity, deliveryMethod, buyerAddress, agreedDate, buyerNote } = req.body

  const listing = await CropListing.findById(cropListingId)
  if (!listing || listing.status !== 'active') {
    return res
      .status(400)
      .json({ success: false, message: 'Listing is not available' })
  }
  if (listing.expiryDate < new Date()) {
    return res
      .status(400)
      .json({ success: false, message: 'This listing has expired' })
  }
  if (quantity < listing.minOrderQty) {
    return res.status(400).json({
      success: false,
      message: `Minimum order quantity is ${listing.minOrderQty}kg`,
    })
  }
  if (quantity > listing.availableQty) {
    return res.status(400).json({
      success: false,
      message: `Only ${listing.availableQty}kg available`,
    })
  }

  const methodMap = {
    farmer_delivers: listing.delivery.farmerDelivers,
    buyer_pickup: listing.delivery.buyerPickup,
    platform_transporter: listing.delivery.platformTransporter,
  }
  if (!methodMap[deliveryMethod]) {
    return res.status(400).json({
      success: false,
      message: 'Selected delivery method is not available for this listing',
    })
  }

  const pricePerKg = listing.pricePerKg
  const cropAmount = quantity * pricePerKg
  const platformFee = Math.round(cropAmount * 0.02)
  let deliveryFee = 0
  let zone = null
  let distanceKm = null

  if (deliveryMethod === 'platform_transporter') {
    const buyer = await User.findById(req.user._id)
    const result = await calculateDelivery(
      listing.location.district,
      buyer.location.district,
      quantity,
      listing.quality.perishability
    )
    if (!result.available) {
      return res.status(400).json({ success: false, message: result.reason })
    }
    deliveryFee = result.estimatedCost
    zone = result.zone
    distanceKm = result.distanceKm
  }

  const totalAmount = cropAmount + deliveryFee + platformFee

  const order = await Order.create({
    buyer: req.user._id,
    farmer: listing.farmer,
    cropListing: listing._id,
    orderDetails: {
      cropName: listing.cropName,
      quantity,
      pricePerKg,
      cropAmount,
      grade: listing.quality.grade,
      harvestDate: listing.harvestDate,
    },
    delivery: {
      method: deliveryMethod,
      zone,
      distanceKm,
      deliveryFee,
      platformFee,
      totalAmount,
      agreedDate,
      buyerAddress,
    },
    buyerNote,
  })

  listing.availableQty -= quantity
  if (listing.availableQty <= 0) listing.status = 'sold_out'
  await listing.save()

  const buyer = await User.findById(req.user._id)
  await notifyNewOrderRequest(
    listing.farmer,
    buyer.name,
    quantity,
    listing.cropName,
    cropAmount,
    order._id
  )

  return res.status(201).json({ success: true, data: { order } })
})

const getMyOrders = asyncHandler(async (req, res) => {
  const filter = { buyer: req.user._id }
  if (req.query.status) {
    const statuses = req.query.status.split(',').map((s) => s.trim()).filter(Boolean)
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses }
  }

  const orders = await Order.find(filter)
    .populate('cropListing', 'cropName images pricePerKg')
    .populate('farmer', 'name phone location')
    .sort({ createdAt: -1 })

  return res
    .status(200)
    .json(new ApiResponse(200, orders, 'Your orders fetched successfully'))
})

const getIncomingOrders = asyncHandler(async (req, res) => {
  const filter = { farmer: req.user._id }
  if (req.query.status) {
    const statuses = req.query.status.split(',').map((s) => s.trim()).filter(Boolean)
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses }
  }

  const orders = await Order.find(filter)
    .populate('cropListing', 'cropName images pricePerKg')
    .populate('buyer', 'name phone')
    .sort({ createdAt: -1 })

  return res
    .status(200)
    .json(new ApiResponse(200, orders, 'Incoming orders fetched successfully'))
})

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'name phone location')
    .populate('farmer', 'name phone location')
    .populate('cropListing')
    .populate('delivery.pickup.transporter')

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  const buyerId = (order.buyer && (order.buyer._id || order.buyer)).toString()
  const farmerId = (order.farmer && (order.farmer._id || order.farmer)).toString()
  const isBuyer = buyerId === req.user._id.toString()
  const isFarmer = farmerId === req.user._id.toString()
  let isTransporter = false
  if (order.delivery?.pickup?.transporter) {
    const TransporterModel = (await import('../models/Transporter.js')).default
    const transporter = await TransporterModel.findOne({ user: req.user._id })
    const assignedId = (order.delivery.pickup.transporter._id || order.delivery.pickup.transporter).toString()
    if (transporter && assignedId === transporter._id.toString()) {
      isTransporter = true
    }
  }

  if (!isBuyer && !isFarmer && !isTransporter) {
    throw new ApiError(403, 'You are not authorized to view this order')
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, 'Order fetched successfully'))
})

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body

  const ALLOWED_STATUSES = ['accepted', 'declined', 'cancelled']

  if (!status) {
    throw new ApiError(400, 'status field is required')
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status "${status}".`)
  }

  const order = await Order.findById(req.params.id)

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  if (order.farmer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this order')
  }

  if (order.status !== 'pending') {
    throw new ApiError(
      400,
      `Order is already "${order.status}" and cannot be updated`
    )
  }

  order.status = status
  const updatedOrder = await order.save()

  return res
    .status(200)
    .json(new ApiResponse(200, updatedOrder, 'Order status updated'))
})

const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('buyer farmer cropListing')

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  if (order.farmer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to accept this order')
  }

  if (order.status !== 'pending') {
    throw new ApiError(400, 'Only pending orders can be accepted')
  }

  if (order.acceptanceDeadline && order.acceptanceDeadline < new Date()) {
    return res
      .status(400)
      .json({ success: false, message: 'Acceptance window has expired' })
  }

  order.status = 'accepted'
  await order.save()

  await notifyOrderAccepted(
    order.buyer,
    order.farmer.name,
    order.orderDetails.quantity,
    order.orderDetails.cropName,
    order._id
  )

  return res.status(200).json({ success: true, data: { order } })
})

const declineOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  if (order.farmer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to decline this order')
  }

  if (order.status !== 'pending') {
    throw new ApiError(400, 'Only pending orders can be declined')
  }

  const listing = await CropListing.findById(order.cropListing)
  if (listing) {
    listing.availableQty += order.orderDetails.quantity
    if (listing.status === 'sold_out') {
      listing.status = 'active'
    }
    await listing.save()
  }

  order.status = 'declined'
  await order.save()

  await notifyOrderDeclined(
    order.buyer,
    '', // farmer name not loaded here
    order.orderDetails.cropName,
    order._id
  )

  return res.status(200).json({ success: true, data: { order } })
})

const schedulePickup = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('cropListing')

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  if (order.farmer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to schedule this pickup')
  }

  if (order.status !== 'accepted') {
    throw new ApiError(400, 'Only accepted orders can be scheduled for pickup')
  }

  if (order.delivery.method !== 'platform_transporter') {
    throw new ApiError(400, 'Pickup scheduling is only for platform transporter')
  }

  const listing = order.cropListing

  const transporter = await Transporter.findOne({
    zones: listing.location.district,
    isAvailable: true,
    isContracted: true,
  })

  if (!transporter) {
    return res.status(400).json({
      success: false,
      message: 'No transporters available for this route',
    })
  }

  const { scheduledDate, scheduledSlot } = req.body
  const otp = generateOTP()

  order.delivery.pickup = {
    scheduledDate,
    scheduledSlot,
    transporter: transporter._id,
    otpCode: otp,
    otpGeneratedAt: new Date(),
  }
  order.status = 'scheduled'

  await order.save()

  await notifyTransporterAssigned(
    order.farmer,
    transporter.companyName,
    scheduledDate,
    scheduledSlot,
    order._id
  )
  await notifyTransporterAssigned(
    order.buyer,
    transporter.companyName,
    scheduledDate,
    scheduledSlot,
    order._id
  )

  return res.status(200).json({ success: true, data: { order } })
})

const verifyOTPAndPickup = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer')
    .populate('cropListing')

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  const result = verifyOTP(order, req.body.otp)
  if (!result.valid) {
    return res
      .status(400)
      .json({ success: false, message: result.reason })
  }

  order.status = 'in_transit'
  order.delivery.dispatchedAt = new Date()
  order.delivery.pickup.farmerConfirmedLoading = true

  await order.save()

  const transporter = await Transporter.findById(
    order.delivery.pickup.transporter
  )

  await notifyOrderInTransit(
    order.buyer._id,
    transporter?.companyName || '',
    order.orderDetails.cropName,
    order._id
  )

  return res.status(200).json({ success: true, data: { order } })
})

const dispatchOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('buyer cropListing')

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  if (order.farmer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to dispatch this order')
  }

  if (order.delivery.method === 'platform_transporter') {
    throw new ApiError(400, 'Dispatch is handled via transporter OTP flow')
  }

  order.status = 'dispatched'
  order.delivery.dispatchedAt = new Date()
  await order.save()

  await notifyOrderDispatched(
    order.buyer._id,
    order.orderDetails.cropName,
    order._id
  )

  return res.status(200).json({ success: true, data: { order } })
})

const confirmHandoff = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('buyer cropListing')

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  if (order.farmer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to confirm this handoff')
  }

  if (order.delivery.method !== 'buyer_pickup') {
    throw new ApiError(400, 'Handoff confirmation is only for buyer pickup')
  }

  order.status = 'delivered'
  order.delivery.deliveredAt = new Date()
  const autoReleaseAt = new Date()
  autoReleaseAt.setHours(autoReleaseAt.getHours() + 48)
  order.payment.autoReleaseAt = autoReleaseAt

  await order.save()

  await notifyOrderDelivered(
    order.buyer._id,
    order.orderDetails.quantity,
    order.orderDetails.cropName,
    order._id
  )

  return res.status(200).json({ success: true, data: { order } })
})

const markDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('buyer cropListing')

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  order.status = 'delivered'
  order.delivery.deliveredAt = new Date()
  const autoReleaseAt = new Date()
  autoReleaseAt.setHours(autoReleaseAt.getHours() + 48)
  order.payment.autoReleaseAt = autoReleaseAt

  await order.save()

  await notifyOrderDelivered(
    order.buyer._id,
    order.orderDetails.quantity,
    order.orderDetails.cropName,
    order._id
  )

  return res.status(200).json({ success: true, data: { order } })
})

const confirmReceived = asyncHandler(async (req, res) => {
  const { farmerRating, farmerComment, transporterRating, transporterComment } = req.body

  const order = await Order.findById(req.params.id)
    .populate('buyer')
    .populate('farmer')
    .populate('cropListing')
    .populate('delivery.pickup.transporter')

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  if (order.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to confirm this order')
  }

  if (order.status !== 'delivered') {
    throw new ApiError(400, 'Only delivered orders can be confirmed')
  }

  order.status = 'completed'
  order.payment.status = 'released'
  order.payment.releasedAt = new Date()

  if (farmerRating) {
    order.farmerReview = {
      rating: farmerRating,
      comment: farmerComment,
      createdAt: new Date(),
    }

    const farmer = await User.findById(order.farmer)
    const newRatingCount = (farmer.ratingCount || 0) + 1
    const currentRating = farmer.rating || 0
    const newRating =
      ((currentRating * (farmer.ratingCount || 0)) + farmerRating) /
      newRatingCount
    farmer.rating = newRating
    farmer.ratingCount = newRatingCount
    farmer.completedOrders = (farmer.completedOrders || 0) + 1
    await farmer.save()
    await farmer.checkVerification()
  }

  if (transporterRating && order.delivery.pickup?.transporter) {
    order.transporterReview = {
      rating: transporterRating,
      comment: transporterComment,
      createdAt: new Date(),
    }

    const transporter = await Transporter.findById(
      order.delivery.pickup.transporter
    )
    if (transporter) {
      const newRatingCount = (transporter.ratingCount || 0) + 1
      const currentRating = transporter.rating || 0
      const newRating =
        ((currentRating * (transporter.ratingCount || 0)) + transporterRating) /
        newRatingCount
      transporter.rating = newRating
      transporter.ratingCount = newRatingCount
      transporter.completedJobs = (transporter.completedJobs || 0) + 1
      await transporter.save()
    }
  }

  const listing = await CropListing.findById(order.cropListing)
  if (listing) {
    listing.inquiryCount = (listing.inquiryCount || 0) + 1
    await listing.save()
  }

  await order.save()

  await notifyPaymentReleased(
    order.farmer,
    order.orderDetails.cropAmount,
    order._id
  )

  return res.status(200).json({ success: true, data: { order } })
})

const raiseDispute = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (!order) {
    throw new ApiError(404, 'Order not found')
  }

  if (['completed', 'cancelled', 'resolved'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot raise dispute on completed/cancelled/resolved orders',
    })
  }

  const imageBuffers = req.files?.map((f) => f.buffer) || []
  const evidenceUrls = await uploadMultipleToCloudinary(imageBuffers)

  order.status = 'disputed'
  const { reason, description } = req.body
  order.dispute = {
    raisedBy: req.user.role,
    reason,
    description,
    raisedAt: new Date(),
    evidence: evidenceUrls,
  }

  await order.save()

  const otherParty =
    req.user.role === 'buyer' ? order.farmer : order.buyer

  await notifyDisputeRaised(otherParty, req.user.role, order._id)

  return res.status(200).json({ success: true, data: { order } })
})

export {
  placeOrder,
  getMyOrders,
  getIncomingOrders,
  getOrderById,
  updateOrderStatus,
  acceptOrder,
  declineOrder,
  schedulePickup,
  verifyOTPAndPickup,
  dispatchOrder,
  confirmHandoff,
  markDelivered,
  confirmReceived,
  raiseDispute,
}
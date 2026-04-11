import Transporter from '../models/Transporter.js'
import { Order } from '../models/order.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import {
  notifyTransporterAssigned,
  notifyOrderInTransit,
  notifyOrderDelivered,
} from '../services/notificationService.js'
import { generateOTP, verifyOTP } from '../services/otpService.js'

// Item 7: Helper to flatten transporter API responses
// Exposes deliveryFee, quantity, deliveryAddress at top level
const flattenOrderForTransporter = (order) => {
  const obj = order.toObject ? order.toObject() : { ...order }
  
  return {
    ...obj,
    // Flatten from orderDetails
    quantity: obj.orderDetails?.quantity,
    // Flatten from delivery
    deliveryFee: obj.delivery?.deliveryFee,
    buyerAddress: obj.delivery?.buyerAddress,
    farmAddress: obj.delivery?.farmAddress,
    // Keep nested objects as well for backwards compatibility
    orderDetails: obj.orderDetails,
    delivery: obj.delivery,
  }
}

export const getAvailableJobs = asyncHandler(async (req, res) => {
  const transporter = await Transporter.findOne({ user: req.user._id })
  if (!transporter) {
    throw new ApiError(404, 'Transporter profile not found')
  }

  // FIX: filter by transporter's own zones — don't expose all platform jobs
  const jobs = await Order.find({
    'delivery.method': 'platform_transporter',
    'delivery.pickup.transporter': null,
    'delivery.zone': { $in: transporter.zones },
    status: { $in: ['accepted', 'scheduled'] },
  })
    .populate('farmer', 'name phone location')
    .populate('buyer', 'name phone')
    .populate('cropListing', 'cropName images')

  // Item 7: Flatten response
  const flattenedJobs = jobs.map(flattenOrderForTransporter)

  return res.status(200).json(new ApiResponse(200, { jobs: flattenedJobs }, 'Available jobs fetched'))
})

export const acceptJob = asyncHandler(async (req, res) => {
  const transporter = await Transporter.findOne({ user: req.user._id })
  if (!transporter) {
    throw new ApiError(404, 'Transporter profile not found')
  }

  if (!transporter.isAvailable) {
    throw new ApiError(400, 'Your profile is marked unavailable — update availability before accepting jobs')
  }

  // FIX: atomic findOneAndUpdate with null transporter guard — prevents race condition
  // where two transporters accept the same job simultaneously
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.orderId,
      'delivery.method': 'platform_transporter',
      'delivery.pickup.transporter': null,
      'delivery.zone': { $in: transporter.zones },
      status: { $in: ['accepted', 'scheduled'] },
    },
    {
      $set: { 'delivery.pickup.transporter': transporter._id },
    },
    { new: true }
  )
    .populate('farmer', 'name phone')
    .populate('cropListing', 'cropName')

  if (!order) {
    // Could be: not found, already assigned, wrong zone, or wrong status
    // Check specifically to give the right error
    const exists = await Order.findById(req.params.orderId)
    if (!exists) throw new ApiError(404, 'Order not found')
    if (exists.delivery?.pickup?.transporter) {
      throw new ApiError(400, 'Job already assigned to another transporter')
    }
    if (!transporter.zones.includes(exists.delivery?.zone)) {
      throw new ApiError(403, 'This job is outside your registered zones')
    }
    throw new ApiError(400, 'Order is not available for pickup')
  }

  const slot = order.delivery.pickup.scheduledSlot || ''
  const date = order.delivery.pickup.scheduledDate
    ? new Date(order.delivery.pickup.scheduledDate).toLocaleDateString('en-IN')
    : 'TBD'

  await notifyTransporterAssigned(
    order.farmer._id || order.farmer,
    transporter.companyName,
    date,
    slot,
    order._id
  ).catch(() => {})

  // Item 7: Flatten response
  const flattenedOrder = flattenOrderForTransporter(order)

  return res.status(200).json(new ApiResponse(200, { order: flattenedOrder }, 'Job accepted successfully'))
})

export const getMyJobs = asyncHandler(async (req, res) => {
  const transporter = await Transporter.findOne({ user: req.user._id })
  if (!transporter) {
    throw new ApiError(404, 'Transporter profile not found')
  }

  const ALLOWED_STATUSES = [
    'scheduled',
    'in_transit',
    'delivered',
    'completed',
    'disputed',
    'cancelled',
  ]

  const filter = { 'delivery.pickup.transporter': transporter._id }

  // FIX: whitelist status query param — never pass raw query string into MongoDB
  if (req.query.status) {
    const requested = req.query.status.split(',').map((s) => s.trim()).filter(Boolean)
    const invalid = requested.filter((s) => !ALLOWED_STATUSES.includes(s))
    if (invalid.length) {
      throw new ApiError(400, `Invalid status filter: ${invalid.join(', ')}`)
    }
    filter.status = requested.length === 1 ? requested[0] : { $in: requested }
  }

  const jobs = await Order.find(filter)
    .populate('farmer', 'name phone location')
    .populate('buyer', 'name phone')
    .populate('cropListing', 'cropName images')
    .sort({ createdAt: -1 })

  // Item 7: Flatten response
  const flattenedJobs = jobs.map(flattenOrderForTransporter)

  return res.status(200).json(new ApiResponse(200, { jobs: flattenedJobs }, 'Your jobs fetched successfully'))
})

export const getMyJobById = asyncHandler(async (req, res) => {
  const transporter = await Transporter.findOne({ user: req.user._id })
  if (!transporter) {
    throw new ApiError(404, 'Transporter profile not found')
  }

  const job = await Order.findOne({
    _id: req.params.orderId,
    'delivery.pickup.transporter': transporter._id,
  })
    .populate('farmer', 'name phone location')
    .populate('buyer', 'name phone')
    .populate('cropListing')

  if (!job) {
    throw new ApiError(404, 'Job not found')
  }

  // Item 7: Flatten response
  const flattenedJob = flattenOrderForTransporter(job)

  return res.status(200).json(new ApiResponse(200, { job: flattenedJob }, 'Job fetched successfully'))
})

// Task 3 — transporter-owned status update
// Owns: scheduled → in_transit (via OTP), in_transit → delivered
// These mirror verifyOTPAndPickup + markDelivered in orderController
// but are exposed under /api/transporter/jobs/:orderId/status for clean role separation
export const updateJobStatus = asyncHandler(async (req, res) => {
  const { status, otp } = req.body

  const TRANSPORTER_ALLOWED_STATUSES = ['in_transit', 'delivered']

  if (!status) {
    throw new ApiError(400, 'status field is required')
  }

  if (!TRANSPORTER_ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status "${status}". Transporters can only set: ${TRANSPORTER_ALLOWED_STATUSES.join(', ')}`
    )
  }

  const transporter = await Transporter.findOne({ user: req.user._id })
  if (!transporter) {
    throw new ApiError(404, 'Transporter profile not found')
  }

  const order = await Order.findOne({
    _id: req.params.orderId,
    'delivery.pickup.transporter': transporter._id,
  })
    .populate('buyer', 'name phone')
    .populate('cropListing', 'cropName')

  if (!order) {
    throw new ApiError(404, 'Job not found or not assigned to you')
  }

  if (order.delivery.method !== 'platform_transporter') {
    throw new ApiError(400, 'Status update is only valid for platform transporter orders')
  }

  if (status === 'in_transit') {
    if (order.status !== 'scheduled') {
      throw new ApiError(
        400,
        `Cannot mark in_transit — order is currently "${order.status}". Must be "scheduled".`
      )
    }

    if (!otp) {
      throw new ApiError(400, 'OTP is required to mark order as in_transit')
    }

    const result = verifyOTP(order, otp)
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason })
    }

    order.status = 'in_transit'
    order.delivery.dispatchedAt = new Date()
    order.delivery.pickup.otpVerifiedAt = new Date()
    order.delivery.pickup.farmerConfirmedLoading = true
    await order.save()

    await notifyOrderInTransit(
      order.buyer._id,
      transporter.companyName,
      order.orderDetails.cropName,
      order._id
    ).catch(() => {})

    // Item 7: Flatten response
    const flattenedOrder = flattenOrderForTransporter(order)
    return res.status(200).json(new ApiResponse(200, { order: flattenedOrder }, 'Order marked as in transit'))
  }

  if (status === 'delivered') {
    if (order.status !== 'in_transit') {
      throw new ApiError(
        400,
        `Cannot mark delivered — order is currently "${order.status}". Must be "in_transit".`
      )
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
    ).catch(() => {})

    // Item 7: Flatten response
    const flattenedOrder = flattenOrderForTransporter(order)
    return res.status(200).json(new ApiResponse(200, { order: flattenedOrder }, 'Order marked as delivered'))
  }
})
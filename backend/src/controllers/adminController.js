import { Order } from '../models/order.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPlatformStats = asyncHandler(async (req, res) => {
  const [users, orders, transporters, disputes] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ role: 'transporter' }),
    Order.countDocuments({ status: 'disputed' }),
  ]);
  return res.status(200).json(new ApiResponse(200, { users, orders, transporters, disputes }, 'Stats fetched'));
});

export const getDisputes = asyncHandler(async (req, res) => {
  const disputes = await Order.find({ status: { $in: ['disputed', 'resolved'] } })
    .populate('buyer', 'name phone')
    .populate('farmer', 'name phone')
    .select('_id status dispute buyer farmer orderDetails createdAt')
    .sort({ 'dispute.raisedAt': -1 });
  return res.status(200).json(new ApiResponse(200, disputes, 'Disputes fetched'));
});

export const resolveDispute = asyncHandler(async (req, res) => {
  const { resolutionNotes } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status !== 'disputed') throw new ApiError(400, 'Order is not in disputed state');
  order.status = 'resolved';
  order.dispute.resolution = resolutionNotes || '';
  await order.save();
  return res.status(200).json(new ApiResponse(200, { _id: order._id, status: order.status }, 'Dispute resolved'));
});

export const getUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 50 } = req.query;
  const filter = role ? { role } : {};
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  return res.status(200).json(new ApiResponse(200, { users, total, page: Number(page) }, 'Users fetched'));
});

export const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const isVerified = req.body.isVerified !== undefined ? req.body.isVerified : true;
  user.isVerified = isVerified;
  if (isVerified) user.verifiedAt = new Date();
  await user.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, { _id: user._id, isVerified: user.isVerified }, 'User verification updated'));
});

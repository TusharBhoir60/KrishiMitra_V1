import Transporter from '../models/Transporter.js';
import { Order } from '../models/order.js';
import { notifyTransporterAssigned } from '../services/notificationService.js';

export const getAvailableJobs = async (req, res) => {
  const jobs = await Order.find({
    'delivery.method': 'platform_transporter',
    'delivery.pickup.transporter': null,
    status: { $in: ['accepted', 'scheduled'] },
  })
    .populate('farmer', 'name phone location')
    .populate('buyer', 'name phone')
    .populate('cropListing', 'cropName images');

  return res.status(200).json({ success: true, data: { jobs } });
};

export const acceptJob = async (req, res) => {
  const transporter = await Transporter.findOne({ user: req.user._id });
  if (!transporter)
    return res.status(404).json({ success: false, message: 'Transporter profile not found' });

  const order = await Order.findById(req.params.orderId)
    .populate('farmer', 'name')
    .populate('cropListing', 'cropName');
  if (!order)
    return res.status(404).json({ success: false, message: 'Order not found' });

  if (order.delivery?.pickup?.transporter)
    return res.status(400).json({ success: false, message: 'Job already assigned to another transporter' });

  if (!['accepted', 'scheduled'].includes(order.status))
    return res.status(400).json({ success: false, message: 'Order is not available for pickup' });

  order.delivery.pickup.transporter = transporter._id;
  await order.save();

  const slot = order.delivery.pickup.scheduledSlot || '';
  const date = order.delivery.pickup.scheduledDate
    ? new Date(order.delivery.pickup.scheduledDate).toLocaleDateString('en-IN')
    : 'TBD';

  await notifyTransporterAssigned(order.farmer._id || order.farmer, transporter.companyName, date, slot, order._id)
    .catch(() => {});

  return res.status(200).json({ success: true, data: { order } });
};

export const getMyJobs = async (req, res) => {
  const transporter = await Transporter.findOne({ user: req.user._id });
  if (!transporter)
    return res.status(404).json({ success: false, message: 'Transporter profile not found' });

  const filter = { 'delivery.pickup.transporter': transporter._id };
  if (req.query.status) filter.status = req.query.status;

  const jobs = await Order.find(filter)
    .populate('farmer', 'name phone location')
    .populate('buyer', 'name phone')
    .populate('cropListing', 'cropName images');

  return res.status(200).json({ success: true, data: { jobs } });
};

export const getMyJobById = async (req, res) => {
  const transporter = await Transporter.findOne({ user: req.user._id });
  if (!transporter)
    return res.status(404).json({ success: false, message: 'Transporter profile not found' });

  const job = await Order.findOne({
    _id: req.params.orderId,
    'delivery.pickup.transporter': transporter._id,
  })
    .populate('farmer', 'name phone location')
    .populate('buyer', 'name phone')
    .populate('cropListing');

  if (!job)
    return res.status(404).json({ success: false, message: 'Job not found' });

  return res.status(200).json({ success: true, data: { job } });
};


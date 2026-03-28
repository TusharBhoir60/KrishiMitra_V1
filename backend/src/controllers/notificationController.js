import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  const { unreadOnly, page = 1, limit = 20 } = req.query;
  const filter = { recipient: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;
  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Notification.countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: {
      notifications,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const markAsRead = async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
  return res.status(200).json({ success: true, data: { notification: notif } });
};

export const markAllAsRead = async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return res.status(200).json({ success: true, data: { updated: result.modifiedCount } });
};

export const getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  return res.status(200).json({ success: true, data: { count } });
};


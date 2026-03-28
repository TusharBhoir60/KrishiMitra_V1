import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'new_order_request',
        'order_accepted',
        'order_declined',
        'order_expired',
        'pickup_scheduled',
        'transporter_assigned',
        'order_dispatched',
        'order_in_transit',
        'order_delivered',
        'order_completed',
        'dispute_raised',
        'payment_released',
        'new_restock',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);


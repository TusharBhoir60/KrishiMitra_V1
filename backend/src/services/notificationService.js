import Notification from '../models/Notification.js';

export async function createNotification(recipientId, type, title, message, orderId = null) {
  const notif = new Notification({ recipient: recipientId, type, title, message, orderId });
  return await notif.save();
}

export const notifyNewOrderRequest = (farmerId, buyerName, quantity, cropName, amount, orderId) =>
  createNotification(
    farmerId,
    'new_order_request',
    'New order request',
    `${buyerName} wants to buy ${quantity}kg of ${cropName} for ₹${amount}`,
    orderId
  );

export const notifyOrderAccepted = (buyerId, farmerName, quantity, cropName, orderId) =>
  createNotification(
    buyerId,
    'order_accepted',
    'Order accepted!',
    `${farmerName} accepted your order for ${quantity}kg of ${cropName}`,
    orderId
  );

export const notifyOrderDeclined = (buyerId, farmerName, cropName, orderId) =>
  createNotification(
    buyerId,
    'order_declined',
    'Order declined',
    `${farmerName} could not fulfill your order for ${cropName}. Browse other farmers.`,
    orderId
  );

export const notifyOrderExpired = (userId, cropName, orderId) =>
  createNotification(
    userId,
    'order_expired',
    'Order expired',
    `The order for ${cropName} expired without a response.`,
    orderId
  );

export const notifyTransporterAssigned = (userId, transporterName, date, slot, orderId) =>
  createNotification(
    userId,
    'transporter_assigned',
    'Transporter assigned',
    `${transporterName} will collect your crops on ${date} at ${slot}`,
    orderId
  );

export const notifyOrderDispatched = (buyerId, cropName, orderId) =>
  createNotification(
    buyerId,
    'order_dispatched',
    'Order dispatched',
    `Your order of ${cropName} has been dispatched and is on its way`,
    orderId
  );

export const notifyOrderInTransit = (buyerId, transporterName, cropName, orderId) =>
  createNotification(
    buyerId,
    'order_in_transit',
    'Your order is moving',
    `${transporterName} picked up ${cropName} and is on the way`,
    orderId
  );

export const notifyOrderDelivered = (buyerId, quantity, cropName, orderId) =>
  createNotification(
    buyerId,
    'order_delivered',
    'Delivery arrived',
    `Your order of ${quantity}kg of ${cropName} has been delivered. Please confirm receipt.`,
    orderId
  );

export const notifyPaymentReleased = (farmerId, amount, orderId) =>
  createNotification(
    farmerId,
    'payment_released',
    'Payment released',
    `₹${amount} has been released for your order`,
    orderId
  );

export const notifyDisputeRaised = (userId, raisedByRole, orderId) =>
  createNotification(
    userId,
    'dispute_raised',
    'Dispute raised',
    `A dispute has been raised by the ${raisedByRole} for this order. Admin will review.`,
    orderId
  );


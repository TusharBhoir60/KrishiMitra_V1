export const getStatusLabel = (status) => {
  const map = {
    pending: 'Pending',
    accepted: 'Accepted',
    scheduled: 'Scheduled',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    completed: 'Completed',
    disputed: 'Disputed',
    declined: 'Declined',
    expired: 'Expired',
    cancelled: 'Cancelled'
  };
  return map[status] || status;
};

export const getStatusColor = (status) => {
  const map = {
    pending: 'bg-amber-100 text-amber-800',
    accepted: 'bg-blue-100 text-blue-800',
    scheduled: 'bg-purple-100 text-purple-800',
    in_transit: 'bg-purple-100 text-purple-800',
    delivered: 'bg-teal-100 text-teal-800',
    completed: 'bg-green-100 text-green-800',
    disputed: 'bg-red-100 text-red-800',
    declined: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-gray-100 text-gray-600'
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};

export const getNextAction = (order, role) => {
  if (role === 'farmer') {
    if (order.status === 'pending') return { label: "Accept order", action: "accept", color: "green" };
    if (order.status === 'accepted' && order.deliveryMethod === 'farmer_delivers') return { label: "Mark dispatched", action: "dispatch", color: "green" };
    if (order.status === 'accepted' && order.deliveryMethod === 'buyer_pickup') return { label: "Confirm handoff", action: "confirm-handoff", color: "green" };
  }
  if (role === 'buyer') {
    if (order.status === 'delivered') return { label: "Confirm received", action: "confirm-received", color: "green" };
  }
  if (role === 'transporter') {
    if (order.status === 'scheduled') return { label: "Verify OTP", action: "verify-otp", color: "green" };
    if (order.status === 'in_transit') return { label: "Mark as delivered", action: "mark-delivered", color: "green" };
  }
  return null;
};

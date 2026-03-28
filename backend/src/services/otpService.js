export function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function verifyOTP(order, enteredOtp) {
  if (!order.delivery.pickup.otpCode) {
    return { valid: false, reason: 'OTP not generated' };
  }
  if (order.delivery.pickup.otpCode !== enteredOtp) {
    return { valid: false, reason: 'Incorrect OTP' };
  }
  const elapsed = Date.now() - new Date(order.delivery.pickup.otpGeneratedAt).getTime();
  if (elapsed > 15 * 60 * 1000) {
    return { valid: false, reason: 'OTP has expired (valid for 15 minutes)' };
  }
  order.delivery.pickup.otpVerifiedAt = new Date();
  return { valid: true };
}


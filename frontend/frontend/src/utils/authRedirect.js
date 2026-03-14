export const getRoleHomePath = (role) => {
  if (role === 'buyer') return '/buyer/marketplace';
  if (role === 'farmer') return '/farmer/dashboard';
  if (role === 'transporter') return '/transporter/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/auth/login';
};

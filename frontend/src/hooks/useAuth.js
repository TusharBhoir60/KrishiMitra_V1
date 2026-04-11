import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);

  const isFarmer = user?.role === 'farmer';
  const isBuyer = user?.role === 'buyer';
  const isTransporter = user?.role === 'transporter';
  const isAdmin = user?.role === 'admin';

  return {
    user,
    token,
    isAuthenticated,
    isFarmer,
    isBuyer,
    isTransporter,
    isAdmin,
  };
};

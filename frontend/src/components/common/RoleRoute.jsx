import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const RoleRoute = ({ role, children }) => {
  const { user } = useAuth();

  if (user?.role !== role) {
    return <Navigate to={`/${user?.role || ''}/dashboard`} replace />;
  }

  return children;
};

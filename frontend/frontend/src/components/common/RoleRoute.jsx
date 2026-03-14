import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getRoleHomePath } from '../../utils/authRedirect';

export const RoleRoute = ({ role, children }) => {
  const { user } = useAuth();

  if (user?.role !== role) {
    return <Navigate to={getRoleHomePath(user?.role)} replace />;
  }

  return children;
};

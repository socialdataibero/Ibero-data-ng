import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getToken } from '../api/http';
import { useAuth } from '../auth/useAuth';

export function RequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return getToken() ? <Outlet /> : null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

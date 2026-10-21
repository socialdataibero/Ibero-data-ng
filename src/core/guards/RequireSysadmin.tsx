import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/** Sends anyone who is not the sysadmin back to `redirectTo`; the server enforces it too. */
export function RequireSysadmin({ redirectTo }: { redirectTo: string }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  return currentUser?.isSysadmin ? <Outlet /> : <Navigate to={redirectTo} replace />;
}

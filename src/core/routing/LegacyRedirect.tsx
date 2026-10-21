import { Navigate, useLocation } from 'react-router-dom';

/** Sends an old (Spanish) portal URL to its English route, keeping the query string and hash. */
export function LegacyRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: to, search, hash }} replace />;
}

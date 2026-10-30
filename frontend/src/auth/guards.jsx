import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { PageSpinner } from '../components/Feedback';
import Forbidden from '../pages/Forbidden';

/** Signed-in users only. Anonymous visitors are sent to /login and returned here afterwards. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageSpinner label="Checking your session…" />;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}

/**
 * Admins only. This is a convenience for the UI: the backend independently enforces ADMIN on every admin endpoint.
 */
export function RequireAdmin() {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageSpinner label="Checking your session…" />;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (!isAdmin) return <Forbidden />;
  return <Outlet />;
}

/** Login/Register are pointless when already signed in. */
export function GuestOnly() {
  const { status } = useAuth();
  if (status === 'loading') return <PageSpinner label="Checking your session…" />;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

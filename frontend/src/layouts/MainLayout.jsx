import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, ShieldCheck, Tag, X } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { useToast } from '../components/toastContext';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-harbor-50 text-harbor-800' : 'text-ink hover:bg-harbor-50 hover:text-harbor-800'
  }`;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-harbor-800">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg rounded-tr-2xl bg-harbor-600 text-white">
        <Tag className="h-5 w-5" aria-hidden="true" />
      </span>
      Lost &amp; Found
    </Link>
  );
}

export default function MainLayout() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  async function handleLogout() {
    close();
    await logout();
    notify('You have been signed out.');
    navigate('/', { replace: true });
  }

  const nav = (
    <>
      <NavLink to="/items" className={linkClass} onClick={close}>
        Browse items
      </NavLink>
      {isAuthenticated && (
        <>
          <NavLink to="/dashboard" className={linkClass} onClick={close}>
            Dashboard
          </NavLink>
          <NavLink to="/my-items" className={linkClass} onClick={close}>
            My reports
          </NavLink>
          <NavLink to="/my-claims" className={linkClass} onClick={close}>
            My claims
          </NavLink>
        </>
      )}
      {isAdmin && (
        <NavLink to="/admin" className={linkClass} onClick={close}>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Admin
          </span>
        </NavLink>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Brand />
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {nav}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated ? (
              <>
                <Link to="/report-item" className="btn-primary">
                  Report an item
                </Link>
                <NavLink to="/profile" className={linkClass}>
                  {user?.name}
                </NavLink>
                <button type="button" onClick={handleLogout} className="btn-ghost" aria-label="Sign out">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Create account
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn-secondary lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
        {open && (
          <div id="mobile-menu" className="border-t border-line bg-surface lg:hidden">
            <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-3">
              {nav}
              <div className="my-2 h-px bg-line" />
              {isAuthenticated ? (
                <>
                  <Link to="/report-item" className="btn-primary" onClick={close}>
                    Report an item
                  </Link>
                  <NavLink to="/profile" className={linkClass} onClick={close}>
                    Profile ({user?.name})
                  </NavLink>
                  <button type="button" onClick={handleLogout} className="btn-ghost justify-start">
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary" onClick={close}>
                    Sign in
                  </Link>
                  <Link to="/register" className="btn-primary" onClick={close}>
                    Create account
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p>Found something? Lost something? Start by browsing what has been reported.</p>
        </div>
      </footer>
    </div>
  );
}

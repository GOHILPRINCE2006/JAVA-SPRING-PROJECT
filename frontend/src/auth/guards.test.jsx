import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from './AuthContext';
import { GuestOnly, RequireAdmin, RequireAuth } from './guards';

function renderAt(path, auth) {
  const value = { isAdmin: auth.user?.role === 'ADMIN', ...auth };
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<h1>Login page</h1>} />
          <Route path="/dashboard" element={<h1>Dashboard page</h1>} />
          <Route element={<RequireAuth />}>
            <Route path="/my-items" element={<h1>My items page</h1>} />
          </Route>
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<h1>Admin page</h1>} />
          </Route>
          <Route element={<GuestOnly />}>
            <Route path="/register" element={<h1>Register page</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

const member = { status: 'authenticated', user: { id: 1, role: 'USER' } };
const admin = { status: 'authenticated', user: { id: 2, role: 'ADMIN' } };
const anonymous = { status: 'anonymous', user: null };

describe('route guards', () => {
  it('sends anonymous visitors to the login page', () => {
    renderAt('/my-items', anonymous);
    expect(screen.getByRole('heading', { name: 'Login page' })).toBeInTheDocument();
  });

  it('shows a loading state while the session is being checked', () => {
    renderAt('/my-items', { status: 'loading', user: null });
    expect(screen.getByRole('status')).toHaveTextContent(/checking your session/i);
  });

  it('lets signed-in users through', () => {
    renderAt('/my-items', member);
    expect(screen.getByRole('heading', { name: 'My items page' })).toBeInTheDocument();
  });

  it('blocks non-admins from admin routes with a 403 view', () => {
    renderAt('/admin', member);
    expect(screen.getByText(/do not have access/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admin page' })).not.toBeInTheDocument();
  });

  it('lets admins into admin routes', () => {
    renderAt('/admin', admin);
    expect(screen.getByRole('heading', { name: 'Admin page' })).toBeInTheDocument();
  });

  it('redirects signed-in users away from the register page', () => {
    renderAt('/register', member);
    expect(screen.getByRole('heading', { name: 'Dashboard page' })).toBeInTheDocument();
  });
});

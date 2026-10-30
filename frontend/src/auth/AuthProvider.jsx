import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { AuthContext } from './AuthContext';

/**
 * Auth state mirrors the server session (HttpOnly cookie). Nothing secret is stored in the browser:
 * the user object is rebuilt from GET /api/users/profile/me on every page load.
 * status: 'loading' | 'authenticated' | 'anonymous'
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    let active = true;
    authApi
      .currentUser()
      .then((user) => active && setState({ status: 'authenticated', user }))
      .catch(() => active && setState({ status: 'anonymous', user: null }));
    return () => {
      active = false;
    };
  }, []);

  // A 401 from any protected request means the session is gone: drop the user so guards redirect to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => setState({ status: 'anonymous', user: null }));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (credentials) => {
    await authApi.login(credentials);
    const user = await authApi.currentUser();
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setState({ status: 'anonymous', user: null });
    }
  }, []);

  const updateUser = useCallback((user) => setState((previous) => ({ ...previous, user })), []);

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.user,
      isAuthenticated: state.status === 'authenticated',
      isAdmin: state.user?.role === 'ADMIN',
      login,
      logout,
      updateUser,
    }),
    [state, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

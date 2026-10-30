import client, { clearCsrfToken } from './client';

export const authApi = {
  /** Session probe on page load. A 401 here is normal (not signed in), so it must not trigger the global handler. */
  async currentUser() {
    const { data } = await client.get('/api/users/profile/me', { skipUnauthorizedHandler: true });
    return data.data; // { id, name, email, role }
  },

  async login({ email, password }) {
    const { data } = await client.post('/api/users/login', { email, password }, { skipUnauthorizedHandler: true });
    clearCsrfToken(); // the session changed: fetch a fresh token for the next write
    return data.data; // { message, email, name, role, userId }
  },

  async register({ name, email, password }) {
    const { data } = await client.post('/api/users/register', { name, email, password });
    return data.data;
  },

  async logout() {
    try {
      await client.post('/api/users/logout', null, { skipUnauthorizedHandler: true });
    } finally {
      clearCsrfToken();
    }
  },
};

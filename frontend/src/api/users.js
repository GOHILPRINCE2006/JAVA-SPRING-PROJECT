import client from './client';

export const usersApi = {
  /** Admin only. */
  async list(signal) {
    const { data } = await client.get('/api/users', { signal });
    return data.data;
  },
  async update(id, { name, currentPassword, newPassword }) {
    const { data } = await client.put(`/api/users/${id}`, { name, currentPassword, newPassword });
    return data.data;
  },
};

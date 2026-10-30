import client from './client';

export const itemsApi = {
  async list(signal) {
    const { data } = await client.get('/api/items', { signal });
    return data;
  },
  async get(id, signal) {
    const { data } = await client.get(`/api/items/${id}`, { signal });
    return data;
  },
  async mine(signal) {
    const { data } = await client.get('/api/items/user/me', { signal });
    return data;
  },
  async report({ title, description, location, status }, categoryId) {
    const { data } = await client.post(
      '/api/items',
      { title, description, location, status },
      { params: { categoryId } },
    );
    return data;
  },
  async remove(id) {
    await client.delete(`/api/items/${id}`);
  },
};

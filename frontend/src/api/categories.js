import client from './client';

export const categoriesApi = {
  async list(signal) {
    const { data } = await client.get('/api/categories', { signal });
    return data;
  },
  async create({ name, description }) {
    const { data } = await client.post('/api/categories', { name, description });
    return data;
  },
  async remove(id) {
    await client.delete(`/api/categories/${id}`);
  },
};

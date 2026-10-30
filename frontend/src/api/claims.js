import client from './client';

export const claimsApi = {
  async mine(signal) {
    const { data } = await client.get('/api/claims/user/me', { signal });
    return data;
  },
  /** Admin only. */
  async listAll(signal) {
    const { data } = await client.get('/api/claims', { signal });
    return data;
  },
  async submit(itemId, message) {
    const { data } = await client.post('/api/claims', { message }, { params: { itemId } });
    return data;
  },
  /** Admin only. status: APPROVED | REJECTED | RESOLVED */
  async setStatus(id, status) {
    const { data } = await client.put(`/api/claims/${id}/status`, null, { params: { status } });
    return data;
  },
  async remove(id) {
    await client.delete(`/api/claims/${id}`);
  },
};

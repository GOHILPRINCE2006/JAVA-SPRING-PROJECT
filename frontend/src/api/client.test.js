import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import client, { ApiError, clearCsrfToken, setUnauthorizedHandler } from './client';

function respond(config, status, data) {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status >= 200 && status < 300) return Promise.resolve(response);
  return Promise.reject(new AxiosError(`HTTP ${status}`, 'ERR_BAD_REQUEST', config, null, response));
}

let calls;

beforeEach(() => {
  calls = [];
  clearCsrfToken();
  setUnauthorizedHandler(null);
});

function useAdapter(handler) {
  client.defaults.adapter = (config) => {
    calls.push({ method: config.method, url: config.url, csrf: config.headers.get('X-CSRF-TOKEN') });
    return handler(config, calls.length);
  };
}

describe('api client', () => {
  it('sends credentials and never adds a CSRF header to GET requests', async () => {
    useAdapter((config) => respond(config, 200, []));
    expect(client.defaults.withCredentials).toBe(true);
    await client.get('/api/items');
    expect(calls).toHaveLength(1);
    expect(calls[0].csrf).toBeFalsy();
  });

  it('fetches a CSRF token once and sends it on writes', async () => {
    useAdapter((config) =>
      config.url === '/api/auth/csrf'
        ? respond(config, 200, { headerName: 'X-CSRF-TOKEN', token: 'tok-1' })
        : respond(config, 200, { ok: true }),
    );
    await client.post('/api/items', {});
    await client.delete('/api/items/1');
    expect(calls.map((c) => c.url)).toEqual(['/api/auth/csrf', '/api/items', '/api/items/1']);
    expect(calls[1].csrf).toBe('tok-1');
    expect(calls[2].csrf).toBe('tok-1');
  });

  it('refreshes the token and retries once when the server reports a CSRF failure', async () => {
    let tokenNumber = 0;
    let postAttempts = 0;
    useAdapter((config) => {
      if (config.url === '/api/auth/csrf') return respond(config, 200, { headerName: 'X-CSRF-TOKEN', token: `tok-${++tokenNumber}` });
      postAttempts += 1;
      return postAttempts === 1 ? respond(config, 403, { message: 'Invalid or missing CSRF token' }) : respond(config, 200, { ok: true });
    });
    const { data } = await client.post('/api/claims', {});
    expect(data.ok).toBe(true);
    expect(postAttempts).toBe(2);
    expect(calls.filter((c) => c.url === '/api/claims').map((c) => c.csrf)).toEqual(['tok-1', 'tok-2']);
  });

  it('does not retry an ordinary 403 and shows a friendly message', async () => {
    useAdapter((config) =>
      config.url === '/api/auth/csrf' ? respond(config, 200, { headerName: 'X-CSRF-TOKEN', token: 't' }) : respond(config, 403, { message: 'You can only delete your own items' }),
    );
    await expect(client.delete('/api/items/9')).rejects.toMatchObject({ status: 403, message: 'You can only delete your own items' });
    expect(calls.filter((c) => c.url === '/api/items/9')).toHaveLength(1);
  });

  it('normalizes server errors into ApiError without leaking internals', async () => {
    useAdapter((config) => respond(config, 500, { trace: 'java.lang.NullPointerException at ...' }));
    const error = await client.get('/api/items').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.message).not.toMatch(/NullPointer/);
  });

  it('reports an unreachable server clearly', async () => {
    useAdapter(() => Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK')));
    await expect(client.get('/api/items')).rejects.toThrow(/Cannot reach the server/);
  });

  it('calls the unauthorized handler on 401 unless the request opts out', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    useAdapter((config) => respond(config, 401, { message: 'Authentication required' }));
    await client.get('/api/claims/user/me').catch(() => {});
    expect(handler).toHaveBeenCalledTimes(1);
    await client.get('/api/users/profile/me', { skipUnauthorizedHandler: true }).catch(() => {});
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

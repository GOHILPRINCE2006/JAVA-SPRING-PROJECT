import axios from 'axios';

/**
 * Base URL of the Spring Boot API. Defaults to http://localhost:8080.
 * Set VITE_API_BASE_URL= (empty) to use same-origin requests (the Vite dev proxy or a reverse proxy).
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const SAFE_METHODS = new Set(['get', 'head', 'options']);

export const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the HttpOnly session cookie
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

/** Error thrown for every failed API call, with a message that is safe to show to the user. */
export class ApiError extends Error {
  constructor(message, { status = 0, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.cause = cause;
  }
}

export function isCancel(error) {
  return axios.isCancel(error) || error?.cause?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';
}

// ---------------------------------------------------------------- CSRF
// The backend keeps the CSRF token in the session and hands it out at GET /api/auth/csrf.
// It is kept in memory only and sent on every POST/PUT/DELETE.
let csrfToken = null;
let csrfRequest = null;

export function clearCsrfToken() {
  csrfToken = null;
  csrfRequest = null;
}

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = client
      .get('/api/auth/csrf')
      .then((response) => {
        csrfToken = { headerName: response.data.headerName, token: response.data.token };
        return csrfToken;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
}

client.interceptors.request.use(async (config) => {
  if (!SAFE_METHODS.has((config.method || 'get').toLowerCase())) {
    const { headerName, token } = await ensureCsrfToken();
    config.headers.set(headerName, token);
  }
  return config;
});

// ---------------------------------------------------------------- errors
let unauthorizedHandler = null;

/** AuthProvider registers this so a 401 anywhere logs the user out of the UI. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function messageForStatus(status, serverMessage) {
  if (serverMessage && status >= 400 && status < 500) return serverMessage;
  switch (status) {
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'We could not find what you were looking for.';
    default:
      return status >= 500
        ? 'Something went wrong on the server. Please try again in a moment.'
        : serverMessage || 'The request could not be completed.';
  }
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isCancel(error)) {
      throw error;
    }

    const config = error.config;
    const status = error.response?.status;
    const body = error.response?.data;
    const serverMessage = typeof body === 'object' && body !== null ? body.message : undefined;

    // A stale CSRF token (e.g. after the session was replaced): fetch a fresh one and retry once.
    if (
      status === 403 &&
      config &&
      !config.__csrfRetried &&
      !SAFE_METHODS.has((config.method || 'get').toLowerCase()) &&
      typeof serverMessage === 'string' &&
      serverMessage.includes('CSRF')
    ) {
      clearCsrfToken();
      config.__csrfRetried = true;
      return client.request(config);
    }

    if (!error.response) {
      throw new ApiError('Cannot reach the server. Check your connection and that the backend is running.', {
        cause: error,
      });
    }

    if (status === 401 && !config?.skipUnauthorizedHandler && unauthorizedHandler) {
      unauthorizedHandler();
    }

    throw new ApiError(messageForStatus(status, serverMessage), { status, cause: error });
  },
);

export default client;

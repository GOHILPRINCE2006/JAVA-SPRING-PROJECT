import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import client, { clearCsrfToken } from './api/client';
import { AuthProvider } from './auth/AuthProvider';
import { ToastProvider } from './components/Toast';

// The HTTP layer is stubbed at the axios adapter. Payload shapes mirror the backend DTOs
// (ItemResponse, ClaimResponse, CategoryResponse, ApiResponse<UserResponse>).
const category = { id: 1, name: 'Wallets', description: 'Wallets and purses' };
const alice = { id: 1, name: 'Alice' };
const items = [
  { id: 10, title: 'Black wallet', description: 'Found near the library', location: 'Library', status: 'FOUND', reportedAt: '2026-10-01T10:00:00', category, reportedBy: alice },
  { id: 11, title: 'Blue umbrella', description: '', location: 'Gym', status: 'LOST', reportedAt: '2026-10-02T10:00:00', category, reportedBy: { id: 2, name: 'Bob' } },
  { id: 12, title: 'Old keys', description: 'On a red ring', location: 'Cafe', status: 'CLAIMED', reportedAt: '2026-09-20T10:00:00', category, reportedBy: alice },
];
const claims = [
  { id: 5, message: 'It has my student card inside', status: 'PENDING', claimedAt: '2026-10-03T10:00:00', item: { id: 10, title: 'Black wallet', location: 'Library', status: 'FOUND' }, claimedBy: { id: 2, name: 'Bob' }, claimantEmail: 'bob@example.com' },
];

let session; // null | user
let requests;

function reply(config, status, data) {
  const response = { data, status, statusText: '', headers: {}, config };
  if (status < 400) return Promise.resolve(response);
  return Promise.reject(new AxiosError(`HTTP ${status}`, 'ERR_BAD_REQUEST', config, null, response));
}

function backend(config) {
  const path = config.url;
  const method = config.method;
  requests.push(`${method.toUpperCase()} ${path}`);
  const need = (role) => {
    if (!session) return reply(config, 401, { success: false, message: 'Authentication required' });
    if (role && session.role !== role) return reply(config, 403, { success: false, message: 'You do not have permission to perform this action' });
    return null;
  };
  if (path === '/api/auth/csrf') return reply(config, 200, { headerName: 'X-CSRF-TOKEN', token: 't' });
  if (path === '/api/users/profile/me') return need() ?? reply(config, 200, { success: true, data: session });
  if (path === '/api/items' && method === 'get') return reply(config, 200, items);
  if (path === '/api/items/10') return reply(config, 200, items[0]);
  if (path === '/api/items/user/me') return need() ?? reply(config, 200, items.filter((i) => i.reportedBy.id === session.id));
  if (path === '/api/categories') return reply(config, 200, [category]);
  if (path === '/api/claims/user/me') return need() ?? reply(config, 200, []);
  if (path === '/api/claims' && method === 'get') return need('ADMIN') ?? reply(config, 200, claims);
  if (path === '/api/users' && method === 'get') return need('ADMIN') ?? reply(config, 200, { success: true, data: [{ ...session }] });
  return reply(config, 404, { success: false, message: 'not stubbed' });
}

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  session = null;
  requests = [];
  clearCsrfToken();
  client.defaults.adapter = backend;
});

describe('app smoke test', () => {
  it('renders the public home page from live API data', async () => {
    renderApp('/');
    expect(await screen.findAllByText('Black wallet')).not.toHaveLength(0);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
  });

  it('filters the item list by status and search', async () => {
    renderApp('/items');
    expect(await screen.findByText('Showing 3 of 3 items')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Lost' }));
    expect(screen.getByText('Showing 1 of 3 items')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blue umbrella' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'All' }));
    await userEvent.type(screen.getByLabelText(/search/i), 'library');
    expect(screen.getByText('Showing 1 of 3 items')).toBeInTheDocument();
  });

  it('asks anonymous visitors to sign in before claiming', async () => {
    renderApp('/items/10');
    expect(await screen.findByRole('heading', { name: 'Black wallet' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Sign in to claim' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit claim' })).not.toBeInTheDocument();
  });

  it('shows the claim form to a signed-in non-reporter and hides it from the reporter', async () => {
    session = { id: 2, name: 'Bob', email: 'bob@example.com', role: 'USER' };
    const { unmount } = renderApp('/items/10');
    expect(await screen.findByRole('button', { name: 'Submit claim' })).toBeInTheDocument();
    unmount();

    session = { id: 1, name: 'Alice', email: 'alice@example.com', role: 'USER' };
    renderApp('/items/10');
    expect(await screen.findByText(/you cannot claim it/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit claim' })).not.toBeInTheDocument();
  });

  it('redirects anonymous users from protected pages to login', async () => {
    renderApp('/my-claims');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('does not render admin pages for a regular user and never calls admin endpoints', async () => {
    session = { id: 2, name: 'Bob', email: 'bob@example.com', role: 'USER' };
    renderApp('/admin/claims');
    expect(await screen.findByText(/do not have access/i)).toBeInTheDocument();
    expect(requests).not.toContain('GET /api/claims');
  });

  it('shows pending claims to an administrator', async () => {
    session = { id: 3, name: 'Root', email: 'root@example.com', role: 'ADMIN' };
    renderApp('/admin/claims');
    expect(await screen.findByText(/bob@example.com/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument());
  });

  it('shows a helpful page for unknown routes', async () => {
    renderApp('/does-not-exist');
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});

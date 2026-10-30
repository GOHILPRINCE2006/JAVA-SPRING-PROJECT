import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import Login from './Login';

function setup(login) {
  render(
    <AuthContext.Provider value={{ status: 'anonymous', user: null, login }}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/items/7' } }]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/items/:id" element={<h1>Item seven</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('Login page', () => {
  it('shows validation errors and does not call the API', async () => {
    const login = vi.fn();
    setup(login);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows the server error for bad credentials', async () => {
    const login = vi.fn().mockRejectedValue(new ApiError('Invalid email or password', { status: 401 }));
    setup(login);
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('returns the user to the page they came from after signing in', async () => {
    const login = vi.fn().mockResolvedValue({ id: 1, role: 'USER' });
    setup(login);
    await userEvent.type(screen.getByLabelText('Email'), ' a@b.co ');
    await userEvent.type(screen.getByLabelText('Password'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(login).toHaveBeenCalledWith({ email: 'a@b.co', password: 'password1' });
    expect(await screen.findByRole('heading', { name: 'Item seven' })).toBeInTheDocument();
  });
});

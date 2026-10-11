
/* Copyright 2017-present, The Visdom Authors */

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const LocationDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div>
      <div>Current path: {location.pathname}</div>
      <div data-testid="redirect-from">
        {location.state?.from || 'No redirect destination'}
      </div>
      <button onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

const renderProtectedRoute = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard?tab=keys']}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Protected dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading message while authentication is being checked', () => {
    useAuth.mockReturnValue({ user: null, loading: true });

    renderProtectedRoute();

    expect(screen.getByText('Checking Session...')).toBeInTheDocument();
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to login and preserves the requested destination', () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    renderProtectedRoute();

    expect(screen.getByText('Current path: /login')).toBeInTheDocument();
    expect(screen.getByTestId('redirect-from')).toHaveTextContent('/dashboard?tab=keys');
  });

  it('does not return to the protected page when Back is pressed after redirect', () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    renderProtectedRoute();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByText('Current path: /login')).toBeInTheDocument();
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument();
  });

  it('renders protected content for authenticated users', () => {
    useAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com' },
      loading: false,
    });

    renderProtectedRoute();

    expect(screen.getByText('Protected dashboard')).toBeInTheDocument();
  });
});

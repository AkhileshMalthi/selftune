import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../App';

// Mock the API services to avoid real network calls
vi.mock('../services/api', () => ({
    datasetsApi: { getDatasets: vi.fn(() => Promise.resolve([])) },
    jobsApi: { getJobs: vi.fn(() => Promise.resolve([])) },
    modelsApi: { getModels: vi.fn(() => Promise.resolve([])) },
    systemApi: { getHealth: vi.fn(() => Promise.resolve({ status: 'OK' })) },
    userApi: { getProfile: vi.fn(() => Promise.resolve({ name: 'Test User' })) },
    authApi: { login: vi.fn(), register: vi.fn() },
    default: { interceptors: { request: { use: vi.fn() } } }
}));

describe('App Integration (Auth Guard)', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('redirects to login page when no token is present', async () => {
        // 1. Ensure localStorage is empty
        localStorage.clear();

        render(<App />);

        // 2. Wait for the AuthView to appear (Welcome to SelfTune is the main header)
        await waitFor(() => {
            expect(screen.getByText(/Welcome to SelfTune/i)).toBeInTheDocument();
        });

        // 3. Confirm we see the login form
        expect(screen.getByPlaceholderText(/you@email.com/i)).toBeInTheDocument();
    });

    it('redirects to login page if token exists but profile fetch fails (invalid token)', async () => {
        const { userApi } = await import('../services/api');
        userApi.getProfile.mockReturnValueOnce(Promise.resolve(null));

        localStorage.setItem('selftune_token', 'invalid-token');

        render(<App />);

        await waitFor(() => {
            expect(screen.getByText(/Welcome to SelfTune/i)).toBeInTheDocument();
        });

        expect(localStorage.getItem('selftune_token')).toBeNull();
    });
});

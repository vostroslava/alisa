import * as SecureStore from 'expo-secure-store';
import { AuthTokens, LoginCredentials, User } from '../../types';
import { config } from '../../config';

const TOKEN_KEY = 'auth_tokens';

/**
 * AuthService - handles authentication and token management
 * Uses SecureStore for safe token storage (Keychain on iOS, Keystore on Android)
 */
export class AuthService {
    private tokens: AuthTokens | null = null;
    private refreshPromise: Promise<AuthTokens | null> | null = null;

    /**
     * Initialize auth service - load tokens from secure storage
     */
    async initialize(): Promise<boolean> {
        try {
            const stored = await SecureStore.getItemAsync(TOKEN_KEY);
            if (stored) {
                this.tokens = JSON.parse(stored);
                return true;
            }
        } catch {
            // Ignore errors, will require login
        }
        return false;
    }

    /**
     * Login with credentials
     */
    async login(credentials: LoginCredentials): Promise<User> {
        const response = await fetch(`${config.API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Login failed');
        }

        const data = await response.json();

        this.tokens = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + data.expires_in * 1000,
        };

        await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(this.tokens));

        return {
            id: data.user.id,
            email: data.user.email,
        };
    }

    /**
     * Logout - clear tokens
     */
    async logout(): Promise<void> {
        this.tokens = null;
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }

    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean {
        return this.tokens !== null;
    }

    /**
     * Get valid access token (refresh if needed)
     */
    async getAccessToken(): Promise<string | null> {
        if (!this.tokens) {
            return null;
        }

        // Check if token needs refresh
        if (this.tokens.expiresAt - Date.now() < config.TOKEN_REFRESH_THRESHOLD_MS) {
            const refreshed = await this.refreshTokens();
            if (!refreshed) {
                return null;
            }
        }

        return this.tokens.accessToken;
    }

    /**
     * Refresh tokens using refresh token
     */
    private async refreshTokens(): Promise<AuthTokens | null> {
        // Prevent concurrent refresh calls
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.doRefreshTokens();

        try {
            return await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }

    private async doRefreshTokens(): Promise<AuthTokens | null> {
        if (!this.tokens?.refreshToken) {
            return null;
        }

        try {
            const response = await fetch(`${config.API_BASE_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh_token: this.tokens.refreshToken,
                }),
            });

            if (!response.ok) {
                // Refresh failed, logout
                await this.logout();
                return null;
            }

            const data = await response.json();

            this.tokens = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: Date.now() + data.expires_in * 1000,
            };

            await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(this.tokens));
            return this.tokens;
        } catch {
            return null;
        }
    }
}

export const authService = new AuthService();

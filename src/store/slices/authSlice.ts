import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthTokens, User } from '../../types';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    error: string | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        loginSuccess: (state, action: PayloadAction<User>) => {
            state.isAuthenticated = true;
            state.isLoading = false;
            state.user = action.payload;
            state.error = null;
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.isAuthenticated = false;
            state.isLoading = false;
            state.user = null;
            state.error = action.payload;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.isLoading = false;
            state.user = null;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const { setLoading, loginSuccess, loginFailure, logout, clearError } =
    authSlice.actions;

export default authSlice.reducer;

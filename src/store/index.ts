import { configureStore } from '@reduxjs/toolkit';
import { recordingsApi } from './api/recordingsApi';

export const store = configureStore({
    reducer: {
        [recordingsApi.reducerPath]: recordingsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(recordingsApi.middleware),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

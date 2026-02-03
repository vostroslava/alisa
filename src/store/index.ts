import { configureStore } from '@reduxjs/toolkit';
import { authReducer, recordingsReducer } from './slices';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        recordings: recordingsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these paths in the state
                ignoredPaths: ['recordings.pendingRecordingResult'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

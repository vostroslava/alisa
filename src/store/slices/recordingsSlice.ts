import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Recording, RecordingFilter, RecordingResult } from '../../types';
import { recordingsRepository } from '../../repositories';
import { uploadQueueService } from '../../services';
import { config } from '../../config';
import { v4 as uuidv4 } from 'uuid';

interface RecordingsState {
    items: Recording[];
    filter: RecordingFilter;
    search: string;
    isLoading: boolean;
    error: string | null;
    // Recording session state
    isRecording: boolean;
    recordingDuration: number;
    showConfirmModal: boolean;
    pendingRecordingResult: RecordingResult | null;
}

const initialState: RecordingsState = {
    items: [],
    filter: 'all',
    search: '',
    isLoading: false,
    error: null,
    isRecording: false,
    recordingDuration: 0,
    showConfirmModal: false,
    pendingRecordingResult: null,
};

// Async thunks
export const fetchRecordings = createAsyncThunk(
    'recordings/fetchAll',
    async (_, { getState }) => {
        const state = getState() as { recordings: RecordingsState };
        const { filter, search } = state.recordings;
        return await recordingsRepository.getAll(filter, search || undefined);
    }
);

export const saveRecording = createAsyncThunk(
    'recordings/save',
    async (result: RecordingResult) => {
        const now = new Date().toISOString();
        const isTooShort = result.durationSec < config.THRESHOLD_SECONDS;

        const recording: Recording = {
            id: uuidv4(),
            localPath: result.localPath,
            durationSec: result.durationSec,
            startedAt: result.startedAt,
            endedAt: result.endedAt,
            status: isTooShort ? 'too_short' : 'queued',
            uploadAttempts: 0,
            lastError: null,
            remoteId: null,
            idempotencyKey: uuidv4(),
            createdAt: now,
            updatedAt: now,
        };

        await recordingsRepository.create(recording);

        // Enqueue for upload if not too short
        if (!isTooShort) {
            await uploadQueueService.enqueue(recording);
        }

        return recording;
    }
);

export const deleteRecording = createAsyncThunk(
    'recordings/delete',
    async (recordingId: string) => {
        await recordingsRepository.delete(recordingId);
        return recordingId;
    }
);

export const retryUpload = createAsyncThunk(
    'recordings/retry',
    async (recordingId: string) => {
        await uploadQueueService.retry(recordingId);
        return recordingId;
    }
);

const recordingsSlice = createSlice({
    name: 'recordings',
    initialState,
    reducers: {
        setFilter: (state, action: PayloadAction<RecordingFilter>) => {
            state.filter = action.payload;
        },
        setSearch: (state, action: PayloadAction<string>) => {
            state.search = action.payload;
        },
        startRecording: (state) => {
            state.isRecording = true;
            state.recordingDuration = 0;
        },
        updateDuration: (state, action: PayloadAction<number>) => {
            state.recordingDuration = action.payload;
        },
        stopRecording: (state, action: PayloadAction<RecordingResult>) => {
            state.isRecording = false;
            state.pendingRecordingResult = action.payload;
            state.showConfirmModal = true;
        },
        cancelRecording: (state) => {
            state.isRecording = false;
            state.recordingDuration = 0;
            state.pendingRecordingResult = null;
        },
        hideConfirmModal: (state) => {
            state.showConfirmModal = false;
            state.pendingRecordingResult = null;
        },
        updateRecordingStatus: (
            state,
            action: PayloadAction<{ id: string; status: Recording['status'] }>
        ) => {
            const recording = state.items.find((r) => r.id === action.payload.id);
            if (recording) {
                recording.status = action.payload.status;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchRecordings
            .addCase(fetchRecordings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchRecordings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload;
            })
            .addCase(fetchRecordings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch recordings';
            })
            // saveRecording
            .addCase(saveRecording.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
                state.showConfirmModal = false;
                state.pendingRecordingResult = null;
            })
            // deleteRecording
            .addCase(deleteRecording.fulfilled, (state, action) => {
                state.items = state.items.filter((r) => r.id !== action.payload);
            });
    },
});

export const {
    setFilter,
    setSearch,
    startRecording,
    updateDuration,
    stopRecording,
    cancelRecording,
    hideConfirmModal,
    updateRecordingStatus,
} = recordingsSlice.actions;

export default recordingsSlice.reducer;

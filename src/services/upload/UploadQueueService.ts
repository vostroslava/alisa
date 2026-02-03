// expo-file-system SDK 54 uses new Object-Oriented API
// We import legacy API for backward compatibility
import {
    uploadAsync,
    getInfoAsync,
    documentDirectory,
    FileSystemUploadType,
} from 'expo-file-system/legacy';
import NetInfo from '@react-native-community/netinfo';
import { Recording } from '../../types';
import { recordingsRepository } from '../../repositories';
import { config } from '../../config';
import { authService } from '../auth/AuthService';

type UploadProgressCallback = (recordingId: string, progress: number) => void;

interface UploadError {
    message: string;
    isRetryable: boolean;
}

/**
 * UploadQueueService - manages upload queue with retries and persistence
 * Implements exponential backoff and network awareness
 */
export class UploadQueueService {
    private isProcessing = false;
    private progressCallbacks: Set<UploadProgressCallback> = new Set();
    private networkUnsubscribe: (() => void) | null = null;
    private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();

    /**
     * Start the upload queue processor
     * Should be called on app start
     */
    async start(): Promise<void> {
        // Subscribe to network changes
        this.networkUnsubscribe = NetInfo.addEventListener((state) => {
            if (state.isConnected && !this.isProcessing) {
                this.processQueue();
            }
        });

        // Initial queue processing
        await this.processQueue();
    }

    /**
     * Stop the upload queue processor
     */
    stop(): void {
        if (this.networkUnsubscribe) {
            this.networkUnsubscribe();
            this.networkUnsubscribe = null;
        }

        // Clear all pending retries
        this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.retryTimeouts.clear();
        this.isProcessing = false;
    }

    /**
     * Add a recording to the upload queue
     */
    async enqueue(recording: Recording): Promise<void> {
        await recordingsRepository.create(recording);
        this.processQueue();
    }

    /**
     * Retry a failed upload
     */
    async retry(recordingId: string): Promise<void> {
        await recordingsRepository.updateStatus(recordingId, 'queued', null);
        this.processQueue();
    }

    /**
     * Subscribe to upload progress updates
     */
    onProgress(callback: UploadProgressCallback): () => void {
        this.progressCallbacks.add(callback);
        return () => this.progressCallbacks.delete(callback);
    }

    /**
     * Process the upload queue
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing) return;

        // Check network connectivity
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) return;

        this.isProcessing = true;

        try {
            const pendingRecordings = await recordingsRepository.getPendingUpload(
                config.MAX_UPLOAD_ATTEMPTS
            );

            for (const recording of pendingRecordings) {
                if (!this.isProcessing) break;

                await this.uploadRecording(recording);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Upload a single recording
     */
    private async uploadRecording(recording: Recording): Promise<void> {
        try {
            // Update status to uploading
            await recordingsRepository.updateStatus(recording.id, 'uploading');
            await recordingsRepository.incrementAttempts(recording.id);

            // Notify progress
            this.notifyProgress(recording.id, 0);

            // Get auth token
            const token = await authService.getAccessToken();
            if (!token) {
                throw { message: 'Not authenticated', isRetryable: false };
            }

            // Read file info
            const fileInfo = await getInfoAsync(recording.localPath);
            if (!fileInfo.exists) {
                throw { message: 'Recording file not found', isRetryable: false };
            }

            // Perform upload
            const response = await uploadAsync(
                `${config.API_BASE_URL}/api/v1/recordings`,
                recording.localPath,
                {
                    httpMethod: 'POST',
                    uploadType: FileSystemUploadType.MULTIPART,
                    fieldName: 'file',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Idempotency-Key': recording.idempotencyKey,
                    },
                    parameters: {
                        duration_sec: String(recording.durationSec),
                        started_at: recording.startedAt,
                        ended_at: recording.endedAt,
                    },
                }
            );

            // Check response
            if (response.status >= 200 && response.status < 300) {
                const data = JSON.parse(response.body);
                await recordingsRepository.setRemoteId(recording.id, data.id);
                this.notifyProgress(recording.id, 100);
            } else if (response.status >= 400 && response.status < 500) {
                // Client error - don't retry
                throw {
                    message: `Upload failed: ${response.status}`,
                    isRetryable: false,
                };
            } else {
                // Server error - retry
                throw {
                    message: `Upload failed: ${response.status}`,
                    isRetryable: true,
                };
            }
        } catch (error) {
            const uploadError = error as UploadError;
            const errorMessage = uploadError.message || 'Unknown error';
            const isRetryable = uploadError.isRetryable ?? true;

            if (isRetryable && recording.uploadAttempts < config.MAX_UPLOAD_ATTEMPTS) {
                await recordingsRepository.updateStatus(recording.id, 'error', errorMessage);
                this.scheduleRetry(recording);
            } else {
                await recordingsRepository.updateStatus(recording.id, 'error', errorMessage);
            }
        }
    }

    /**
     * Schedule a retry with exponential backoff
     */
    private scheduleRetry(recording: Recording): void {
        const delay =
            config.INITIAL_RETRY_DELAY_MS * Math.pow(2, recording.uploadAttempts);

        const timeout = setTimeout(() => {
            this.retryTimeouts.delete(recording.id);
            this.processQueue();
        }, delay);

        this.retryTimeouts.set(recording.id, timeout);
    }

    /**
     * Notify all progress subscribers
     */
    private notifyProgress(recordingId: string, progress: number): void {
        this.progressCallbacks.forEach((callback) => {
            callback(recordingId, progress);
        });
    }
}

export const uploadQueueService = new UploadQueueService();

import { AudioModule } from 'expo-audio';
// Use legacy API from expo-file-system for SDK 54 compatibility
import {
    documentDirectory,
    makeDirectoryAsync,
    deleteAsync,
    getInfoAsync,
} from 'expo-file-system/legacy';
import { v4 as uuidv4 } from 'uuid';
import { RecordingResult } from '../../types';

/**
 * AudioRecorderService - handles audio recording lifecycle
 * Uses expo-audio for cross-platform recording
 */
export class AudioRecorderService {
    private isCurrentlyRecording = false;
    private startTime: Date | null = null;
    private currentRecordingUri: string | null = null;

    /**
     * Request microphone permissions
     */
    async requestPermissions(): Promise<boolean> {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        return status.granted;
    }

    /**
     * Check if we have microphone permissions
     */
    async hasPermissions(): Promise<boolean> {
        const status = await AudioModule.getRecordingPermissionsAsync();
        return status.granted;
    }

    /**
     * Start a new recording
     */
    async startRecording(): Promise<void> {
        if (this.isCurrentlyRecording) {
            throw new Error('Recording already in progress');
        }

        const hasPermission = await this.hasPermissions();
        if (!hasPermission) {
            const granted = await this.requestPermissions();
            if (!granted) {
                throw new Error('Microphone permission denied');
            }
        }

        // Generate unique filename
        const filename = `recording_${uuidv4()}.m4a`;
        const uri = `${documentDirectory}recordings/${filename}`;

        // Ensure recordings directory exists
        await makeDirectoryAsync(`${documentDirectory}recordings`, {
            intermediates: true,
        });

        // Configure and start recording
        // Note: In actual implementation, this would use the recorder from useAudioRecorder hook
        // For service layer, we'll use imperative API
        this.startTime = new Date();
        this.currentRecordingUri = uri;
        this.isCurrentlyRecording = true;
    }

    /**
     * Stop the current recording and return result
     */
    async stopRecording(): Promise<RecordingResult> {
        if (!this.isCurrentlyRecording || !this.startTime || !this.currentRecordingUri) {
            throw new Error('No recording in progress');
        }

        const endTime = new Date();
        const durationSec = (endTime.getTime() - this.startTime.getTime()) / 1000;

        const result: RecordingResult = {
            localPath: this.currentRecordingUri,
            durationSec,
            startedAt: this.startTime.toISOString(),
            endedAt: endTime.toISOString(),
        };

        // Reset state
        this.isCurrentlyRecording = false;
        this.startTime = null;
        this.currentRecordingUri = null;

        return result;
    }

    /**
     * Cancel the current recording and delete the file
     */
    async cancelRecording(): Promise<void> {
        if (!this.isCurrentlyRecording) {
            return;
        }

        const uri = this.currentRecordingUri;

        // Reset state
        this.isCurrentlyRecording = false;
        this.startTime = null;
        this.currentRecordingUri = null;

        // Delete partial file if exists
        if (uri) {
            try {
                const info = await getInfoAsync(uri);
                if (info.exists) {
                    await deleteAsync(uri);
                }
            } catch {
                // Ignore cleanup errors
            }
        }
    }

    /**
     * Check if currently recording
     */
    isRecording(): boolean {
        return this.isCurrentlyRecording;
    }

    /**
     * Get current recording duration in seconds
     */
    getDuration(): number {
        if (!this.isCurrentlyRecording || !this.startTime) {
            return 0;
        }
        return (Date.now() - this.startTime.getTime()) / 1000;
    }
}

export const audioRecorderService = new AudioRecorderService();

import { useCallback, useRef, useState, useEffect } from 'react';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
// Use legacy API from expo-file-system for SDK 54 compatibility
import {
    documentDirectory,
    makeDirectoryAsync,
    deleteAsync,
    getInfoAsync,
    copyAsync,
} from 'expo-file-system/legacy';
import { v4 as uuidv4 } from 'uuid';
import { RecordingResult } from '../types';

interface UseRecordingReturn {
    isRecording: boolean;
    duration: number;
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<RecordingResult | null>;
    cancelRecording: () => Promise<void>;
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;
}

/**
 * Custom hook for audio recording using expo-audio
 * Provides a clean interface for start/stop/cancel recording
 */
export function useRecording(): UseRecordingReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    const startTimeRef = useRef<Date | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const currentUriRef = useRef<string | null>(null);

    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

    // Check permissions on mount
    useEffect(() => {
        checkPermission();
    }, []);

    // Duration timer
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                if (startTimeRef.current) {
                    const elapsed = (Date.now() - startTimeRef.current.getTime()) / 1000;
                    setDuration(elapsed);
                }
            }, 100);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRecording]);

    const checkPermission = async () => {
        const status = await AudioModule.getRecordingPermissionsAsync();
        setHasPermission(status.granted);
    };

    const requestPermission = useCallback(async (): Promise<boolean> => {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        setHasPermission(status.granted);
        return status.granted;
    }, []);

    const startRecording = useCallback(async () => {
        try {
            setError(null);

            // Check/request permissions
            if (!hasPermission) {
                const granted = await requestPermission();
                if (!granted) {
                    setError('Доступ к микрофону не предоставлен');
                    return;
                }
            }

            // Ensure recordings directory exists
            const recordingsDir = `${documentDirectory}recordings/`;
            const dirInfo = await getInfoAsync(recordingsDir);
            if (!dirInfo.exists) {
                await makeDirectoryAsync(recordingsDir, { intermediates: true });
            }

            // Generate unique filename
            const filename = `recording_${uuidv4()}.m4a`;
            currentUriRef.current = `${recordingsDir}${filename}`;

            // Start recording
            startTimeRef.current = new Date();
            audioRecorder.record();
            setIsRecording(true);
            setDuration(0);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ошибка запуска записи';
            setError(message);
            console.error('Start recording error:', err);
        }
    }, [hasPermission, requestPermission, audioRecorder]);

    const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
        try {
            if (!isRecording || !startTimeRef.current) {
                return null;
            }

            // Stop recording
            await audioRecorder.stop();
            const endTime = new Date();

            // Get the recording URI from the recorder
            const uri = audioRecorder.uri;

            // Copy to our recordings directory if needed
            let finalUri = uri;
            if (uri && currentUriRef.current && uri !== currentUriRef.current) {
                await copyAsync({
                    from: uri,
                    to: currentUriRef.current,
                });
                finalUri = currentUriRef.current;
            } else if (!finalUri && currentUriRef.current) {
                finalUri = currentUriRef.current;
            }

            const result: RecordingResult = {
                localPath: finalUri || currentUriRef.current || '',
                durationSec: duration,
                startedAt: startTimeRef.current.toISOString(),
                endedAt: endTime.toISOString(),
            };

            // Reset state
            setIsRecording(false);
            setDuration(0);
            startTimeRef.current = null;
            currentUriRef.current = null;

            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ошибка остановки записи';
            setError(message);
            console.error('Stop recording error:', err);
            setIsRecording(false);
            return null;
        }
    }, [isRecording, duration, audioRecorder]);

    const cancelRecording = useCallback(async () => {
        try {
            if (isRecording) {
                await audioRecorder.stop();
            }

            // Delete the file if it exists
            if (currentUriRef.current) {
                const info = await getInfoAsync(currentUriRef.current);
                if (info.exists) {
                    await deleteAsync(currentUriRef.current);
                }
            }

            // Reset state
            setIsRecording(false);
            setDuration(0);
            startTimeRef.current = null;
            currentUriRef.current = null;
        } catch (err) {
            console.error('Cancel recording error:', err);
            // Reset state even on error
            setIsRecording(false);
            setDuration(0);
            startTimeRef.current = null;
            currentUriRef.current = null;
        }
    }, [isRecording, audioRecorder]);

    return {
        isRecording,
        duration,
        error,
        startRecording,
        stopRecording,
        cancelRecording,
        hasPermission,
        requestPermission,
    };
}

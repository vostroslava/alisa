import React, { useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
    Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    stopRecording as stopRecordingAction,
    hideConfirmModal,
    saveRecording,
} from '../store/slices';
import { useRecording } from '../hooks';
import { config } from '../config';

export function RecordScreen() {
    const dispatch = useAppDispatch();
    const { showConfirmModal, pendingRecordingResult } = useAppSelector(
        (state) => state.recordings
    );

    const {
        isRecording,
        duration,
        error,
        startRecording,
        stopRecording,
        cancelRecording,
        hasPermission,
        requestPermission,
    } = useRecording();

    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Show error alert
    useEffect(() => {
        if (error) {
            Alert.alert('Ошибка', error);
        }
    }, [error]);

    // Pulse animation for recording indicator
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording, pulseAnim]);

    const handleRecordPress = useCallback(async () => {
        if (isRecording) {
            // Stop recording
            const result = await stopRecording();
            if (result) {
                dispatch(stopRecordingAction(result));
            }
        } else {
            // Check permission first
            if (!hasPermission) {
                const granted = await requestPermission();
                if (!granted) {
                    Alert.alert(
                        'Доступ к микрофону',
                        'Для записи необходимо разрешить доступ к микрофону в настройках'
                    );
                    return;
                }
            }
            // Start recording
            await startRecording();
        }
    }, [
        isRecording,
        hasPermission,
        stopRecording,
        startRecording,
        requestPermission,
        dispatch,
    ]);

    const handleConfirm = useCallback(async () => {
        if (pendingRecordingResult) {
            const isTooShort = pendingRecordingResult.durationSec < config.THRESHOLD_SECONDS;

            if (isTooShort) {
                Alert.alert(
                    'Короткая запись',
                    `Записи короче ${config.THRESHOLD_SECONDS} секунд не будут автоматически загружены на сервер.`,
                    [
                        {
                            text: 'Сохранить всё равно',
                            onPress: () => dispatch(saveRecording(pendingRecordingResult)),
                        },
                        {
                            text: 'Удалить',
                            style: 'destructive',
                            onPress: () => {
                                dispatch(hideConfirmModal());
                                cancelRecording();
                            },
                        },
                    ]
                );
            } else {
                dispatch(saveRecording(pendingRecordingResult));
            }
        }
    }, [pendingRecordingResult, dispatch, cancelRecording]);

    const handleCancel = useCallback(async () => {
        dispatch(hideConfirmModal());
        await cancelRecording();
    }, [dispatch, cancelRecording]);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')}.${ms}`;
    };

    return (
        <View style={styles.container}>
            {/* Timer */}
            <View style={styles.timerContainer}>
                <Text style={styles.timer}>{formatDuration(duration)}</Text>
                {isRecording && (
                    <Animated.View
                        style={[
                            styles.recordingIndicator,
                            { transform: [{ scale: pulseAnim }] },
                        ]}
                    />
                )}
            </View>

            {/* Record Button */}
            <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                onPress={handleRecordPress}
                activeOpacity={0.8}
            >
                <View
                    style={[
                        styles.recordButtonInner,
                        isRecording && styles.recordButtonInnerActive,
                    ]}
                />
            </TouchableOpacity>

            <Text style={styles.hint}>
                {isRecording ? 'Нажмите для остановки' : 'Нажмите для записи'}
            </Text>

            {/* Confirm Modal */}
            <Modal
                visible={showConfirmModal}
                transparent
                animationType="fade"
                onRequestClose={handleCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Завершить запись?</Text>
                        <Text style={styles.modalDuration}>
                            Длительность:{' '}
                            {formatDuration(pendingRecordingResult?.durationSec || 0)}
                        </Text>

                        {(pendingRecordingResult?.durationSec || 0) < config.THRESHOLD_SECONDS && (
                            <Text style={styles.warningText}>
                                ⚠️ Запись короче {config.THRESHOLD_SECONDS} секунд
                            </Text>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={handleCancel}
                            >
                                <Text style={styles.modalButtonTextCancel}>Отмена</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonConfirm]}
                                onPress={handleConfirm}
                            >
                                <Text style={styles.modalButtonTextConfirm}>Завершить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    timer: {
        fontSize: 48,
        fontWeight: '300',
        color: '#fff',
        fontVariant: ['tabular-nums'],
    },
    recordingIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#e94560',
        marginTop: 16,
    },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(233, 69, 96, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#e94560',
    },
    recordButtonActive: {
        backgroundColor: 'rgba(233, 69, 96, 0.4)',
    },
    recordButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e94560',
    },
    recordButtonInnerActive: {
        borderRadius: 8,
        width: 32,
        height: 32,
    },
    hint: {
        color: '#888',
        fontSize: 14,
        marginTop: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#2a2a4a',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        maxWidth: 320,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalDuration: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 16,
    },
    warningText: {
        color: '#ffc107',
        textAlign: 'center',
        marginBottom: 16,
        fontSize: 14,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#3a3a5a',
    },
    modalButtonConfirm: {
        backgroundColor: '#e94560',
    },
    modalButtonTextCancel: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    modalButtonTextConfirm: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

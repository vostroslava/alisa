import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAudioPlayer } from 'expo-audio';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteRecording, retryUpload, fetchRecordings } from '../store/slices';
import { Recording } from '../types';
import * as FileSystem from 'expo-file-system';

type RootStackParamList = {
    RecordingDetail: { recordingId: string };
};

const STATUS_LABELS: Record<Recording['status'], string> = {
    queued: 'В очереди на загрузку',
    uploading: 'Загружается...',
    uploaded: 'Успешно загружено',
    error: 'Ошибка загрузки',
    too_short: 'Слишком короткая запись',
};

const STATUS_COLORS: Record<Recording['status'], string> = {
    queued: '#ffc107',
    uploading: '#2196f3',
    uploaded: '#4caf50',
    error: '#f44336',
    too_short: '#9e9e9e',
};

export function RecordingDetailScreen() {
    const route = useRoute<RouteProp<RootStackParamList, 'RecordingDetail'>>();
    const navigation = useNavigation();
    const dispatch = useAppDispatch();

    const recording = useAppSelector((state) =>
        state.recordings.items.find((r) => r.id === route.params.recordingId)
    );

    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackPosition, setPlaybackPosition] = useState(0);

    const player = useAudioPlayer(recording?.localPath || '');

    useEffect(() => {
        if (!recording) {
            dispatch(fetchRecordings());
        }
    }, [recording, dispatch]);

    const handlePlayPause = async () => {
        if (!recording) return;

        if (isPlaying) {
            player.pause();
            setIsPlaying(false);
        } else {
            player.play();
            setIsPlaying(true);
        }
    };

    const handleRetry = async () => {
        if (recording) {
            dispatch(retryUpload(recording.id));
        }
    };

    const handleDelete = () => {
        if (!recording) return;

        const canDelete =
            recording.status === 'uploaded' ||
            recording.status === 'too_short' ||
            recording.status === 'error';

        if (!canDelete) {
            Alert.alert(
                'Невозможно удалить',
                'Дождитесь завершения загрузки перед удалением'
            );
            return;
        }

        Alert.alert(
            'Удалить запись?',
            'Это действие нельзя отменить',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        // Delete local file
                        try {
                            const info = await FileSystem.getInfoAsync(recording.localPath);
                            if (info.exists) {
                                await FileSystem.deleteAsync(recording.localPath);
                            }
                        } catch {
                            // Ignore file deletion errors
                        }

                        dispatch(deleteRecording(recording.id));
                        navigation.goBack();
                    },
                },
            ]
        );
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (isoString: string): string => {
        const date = new Date(isoString);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!recording) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Загрузка...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Status */}
                <View
                    style={[
                        styles.statusContainer,
                        { backgroundColor: STATUS_COLORS[recording.status] + '20' },
                    ]}
                >
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: STATUS_COLORS[recording.status] },
                        ]}
                    />
                    <Text
                        style={[
                            styles.statusText,
                            { color: STATUS_COLORS[recording.status] },
                        ]}
                    >
                        {STATUS_LABELS[recording.status]}
                    </Text>
                </View>

                {/* Playback */}
                <View style={styles.playbackSection}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={handlePlayPause}
                    >
                        <Text style={styles.playButtonText}>
                            {isPlaying ? '⏸' : '▶️'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.duration}>
                        {formatDuration(recording.durationSec)}
                    </Text>
                </View>

                {/* Metadata */}
                <View style={styles.metadataSection}>
                    <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Начало:</Text>
                        <Text style={styles.metadataValue}>
                            {formatDate(recording.startedAt)}
                        </Text>
                    </View>
                    <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Окончание:</Text>
                        <Text style={styles.metadataValue}>
                            {formatDate(recording.endedAt)}
                        </Text>
                    </View>
                    {recording.uploadAttempts > 0 && (
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Попытки загрузки:</Text>
                            <Text style={styles.metadataValue}>
                                {recording.uploadAttempts}
                            </Text>
                        </View>
                    )}
                    {recording.lastError && (
                        <View style={styles.errorSection}>
                            <Text style={styles.errorLabel}>Последняя ошибка:</Text>
                            <Text style={styles.errorText}>{recording.lastError}</Text>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                    {(recording.status === 'error' || recording.status === 'too_short') && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.retryButton]}
                            onPress={handleRetry}
                        >
                            <Text style={styles.actionButtonText}>Повторить загрузку</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDelete}
                    >
                        <Text style={styles.actionButtonText}>Удалить</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        padding: 20,
    },
    loadingText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        gap: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '500',
    },
    playbackSection: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e94560',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    playButtonText: {
        fontSize: 32,
    },
    duration: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
    },
    metadataSection: {
        backgroundColor: '#2a2a4a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#3a3a5a',
    },
    metadataLabel: {
        color: '#888',
        fontSize: 14,
    },
    metadataValue: {
        color: '#fff',
        fontSize: 14,
    },
    errorSection: {
        marginTop: 12,
        padding: 12,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: 8,
    },
    errorLabel: {
        color: '#f44336',
        fontSize: 12,
        marginBottom: 4,
    },
    errorText: {
        color: '#f44336',
        fontSize: 14,
    },
    actionsSection: {
        gap: 12,
    },
    actionButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    retryButton: {
        backgroundColor: '#2196f3',
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

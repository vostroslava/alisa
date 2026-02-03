import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    SafeAreaView,
} from 'react-native';
import { useRecording } from '../hooks/useRecording';
import { useAddRecordingMutation } from '../store/api/recordingsApi';
import { Waveform } from '../components';
import { useNavigation } from '@react-navigation/native';
import { RecordingResult } from '../types';

export function RecordScreen() {
    const navigation = useNavigation();
    const {
        isRecording,
        duration,
        error,
        startRecording,
        stopRecording,
        cancelRecording,
    } = useRecording();

    const [addRecording] = useAddRecordingMutation();

    const [modalVisible, setModalVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [pendingResult, setPendingResult] = useState<RecordingResult | null>(null);

    const formatDuration = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m
            .toString()
            .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleRecordPress = useCallback(async () => {
        if (isRecording) {
            const result = await stopRecording();
            if (result) {
                setPendingResult(result);
                setModalVisible(true);
            }
        } else {
            await startRecording();
        }
    }, [isRecording, stopRecording, startRecording]);

    const handleFinish = async () => {
        if (pendingResult) {
            const startDate = new Date(pendingResult.startedAt);
            const endDate = new Date(pendingResult.endedAt);

            await addRecording({
                localUri: pendingResult.localPath,
                durationSec: pendingResult.durationSec,
                startedAt: startDate,
                endedAt: endDate,
            });

            setModalVisible(false);
            setSuccessVisible(true);

            // Auto hide success after 2s
            setTimeout(() => {
                setSuccessVisible(false);
                setPendingResult(null);
                // Optionally navigate to Archive
                // navigation.navigate('Archive' as any); 
            }, 2000);
        }
    };

    const handleCancel = () => {
        cancelRecording();
        setModalVisible(false);
        setPendingResult(null);
    };

    if (successVisible && pendingResult) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContent}>
                    <View style={styles.checkmarkContainer}>
                        <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <Text style={styles.successTitle}>The recording was saved successfully</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Conversation Time</Text>
                            <Text style={styles.statValue}>{formatDuration(pendingResult.durationSec)}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Start of conversation</Text>
                            <Text style={styles.statValue}>
                                {new Date(pendingResult.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>End of conversation</Text>
                            <Text style={styles.statValue}>
                                {new Date(pendingResult.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                {isRecording ? (
                    <>
                        <Text style={styles.timerLarge}>{formatDuration(duration)}</Text>
                        <View style={styles.waveformContainer}>
                            <Waveform isRecording={isRecording} />
                        </View>
                    </>
                ) : (
                    <Text style={styles.title}>Tap to start recording</Text>
                )}

                <TouchableOpacity
                    style={styles.mainButton}
                    onPress={handleRecordPress}
                    activeOpacity={0.8}
                >
                    <View style={[styles.mainButtonInner, isRecording && styles.stopButton]} />
                </TouchableOpacity>
            </View>

            {/* Confirm Modal */}
            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.timerSmall}>{formatDuration(pendingResult?.durationSec || 0)}</Text>
                        </View>
                        <Text style={styles.modalTitle}>Do you want to finish the recording?</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.outlineButton} onPress={handleCancel}>
                                <Text style={styles.outlineButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.blackButton} onPress={handleFinish}>
                                <Text style={styles.blackButtonText}>Finish</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100, // Space for button
    },
    title: {
        fontSize: 18,
        color: '#000',
        marginBottom: 60,
        fontWeight: '500',
    },
    timerLarge: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 40,
        color: '#000',
        fontVariant: ['tabular-nums'],
    },
    timerSmall: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 10,
        fontVariant: ['tabular-nums'],
    },
    waveformContainer: {
        height: 60,
        marginBottom: 60,
        width: '80%',
    },
    mainButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#999', // Gray circle container logic from design? Or just minimal? Design shows gray circle.
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 50,
    },
    mainButtonInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#8E8E93', // iOS Gray
    },
    stopButton: {
        width: 30,
        height: 30,
        borderRadius: 4,
        backgroundColor: '#fff', // White square inside gray circle? Or Gray circle becomes stop? 
        // Design shows: 
        // Idle: Gray Circle with Mic Icon (white)
        // Recording: Gray Circle with Stop Square (white)
        // Let's adjust to match design better
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        alignItems: 'center',
    },
    modalHeader: {
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    outlineButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#000',
        alignItems: 'center',
    },
    outlineButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    blackButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#000',
        alignItems: 'center',
    },
    blackButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },

    // Success Screen
    successContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    checkmarkContainer: {
        marginBottom: 24,
    },
    checkmark: {
        fontSize: 48,
        color: '#000',
    },
    successTitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 48,
    },
    statsContainer: {
        width: '100%',
        backgroundColor: '#F2F2F7', // Light gray block
        borderRadius: 12,
        padding: 16,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    statLabel: {
        color: '#8E8E93',
        fontSize: 14,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '500',
    },
});

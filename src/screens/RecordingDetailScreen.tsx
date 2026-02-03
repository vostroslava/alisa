import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useGetRecordingsQuery, useDeleteRecordingMutation } from '../store/api/recordingsApi';
import { useAudioPlayer } from 'expo-audio';

type DetailRouteProp = RouteProp<RootStackParamList, 'RecordingDetail'>;

export function RecordingDetailScreen() {
    const route = useRoute<DetailRouteProp>();
    const navigation = useNavigation();
    const { recordingId } = route.params;

    const { recording } = useGetRecordingsQuery(undefined, {
        selectFromResult: ({ data }) => ({
            recording: data?.find(r => r.id === recordingId)
        })
    });

    const [deleteRecording] = useDeleteRecordingMutation();
    const [isPlaying, setIsPlaying] = useState(false);

    // Mock player logic (since real file might not exist for mock items)
    // If localUri exists, we could use expo-audio. 
    // For now, let's just toggle UI state for the prototype look.
    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Recording',
            'Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteRecording(recordingId);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    if (!recording) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text>Recording not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>{'< Back'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Recording</Text>
                <Text style={styles.subtitle}>#{recording.id}</Text>

                <View style={styles.infoBlock}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Date</Text>
                        <Text style={styles.value}>{recording.date}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Conversation Time</Text>
                        <Text style={styles.value}>{recording.duration}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Start of conversation</Text>
                        <Text style={styles.value}>{recording.startTime}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>End of conversation</Text>
                        <Text style={styles.value}>{recording.endTime}</Text>
                    </View>
                </View>

                {/* Player UI */}
                <View style={styles.playerContainer}>
                    <TouchableOpacity onPress={handlePlayPause}>
                        <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
                    </TouchableOpacity>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: isPlaying ? '50%' : '0%' }]} />
                        <View style={[styles.knob, { left: isPlaying ? '50%' : '0%' }]} />
                    </View>
                    <Text style={styles.durationText}>{recording.duration}</Text>
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteText}>Delete Recording</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        padding: 10,
    },
    backText: {
        fontSize: 16,
        color: '#000',
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 32,
    },
    infoBlock: {
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        padding: 20,
        marginBottom: 40,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    label: {
        color: '#8E8E93',
        fontSize: 14,
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
    },
    playerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 40,
    },
    playIcon: {
        fontSize: 24,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#E5E5EA',
        borderRadius: 2,
        justifyContent: 'center',
    },
    progressFill: {
        height: 4,
        backgroundColor: '#000',
        borderRadius: 2,
    },
    knob: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#000',
        position: 'absolute',
        marginLeft: -6,
    },
    durationText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    deleteButton: {
        alignItems: 'center',
        padding: 16,
    },
    deleteText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '500',
    },
});

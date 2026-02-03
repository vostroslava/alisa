import React, { useEffect, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchRecordings, setFilter, setSearch } from '../store/slices';
import { Recording, RecordingFilter } from '../types';

type RootStackParamList = {
    Archive: undefined;
    RecordingDetail: { recordingId: string };
};

const FILTERS: { key: RecordingFilter; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'uploaded', label: 'Загружены' },
    { key: 'pending', label: 'В ожидании' },
    { key: 'error', label: 'Ошибки' },
];

const STATUS_LABELS: Record<Recording['status'], string> = {
    queued: 'В очереди',
    uploading: 'Загрузка...',
    uploaded: 'Загружено',
    error: 'Ошибка',
    too_short: 'Слишком короткая',
};

const STATUS_COLORS: Record<Recording['status'], string> = {
    queued: '#ffc107',
    uploading: '#2196f3',
    uploaded: '#4caf50',
    error: '#f44336',
    too_short: '#9e9e9e',
};

export function ArchiveScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const dispatch = useAppDispatch();
    const { items, filter, search, isLoading } = useAppSelector(
        (state) => state.recordings
    );

    useEffect(() => {
        dispatch(fetchRecordings());
    }, [dispatch, filter, search]);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (isoString: string): string => {
        const date = new Date(isoString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderRecording = ({ item }: { item: Recording }) => (
        <TouchableOpacity
            style={styles.recordingItem}
            onPress={() => navigation.navigate('RecordingDetail', { recordingId: item.id })}
        >
            <View style={styles.recordingInfo}>
                <Text style={styles.recordingDate}>{formatDate(item.startedAt)}</Text>
                <Text style={styles.recordingDuration}>
                    {formatDuration(item.durationSec)}
                </Text>
            </View>
            <View
                style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[item.status] + '20' },
                ]}
            >
                <View
                    style={[
                        styles.statusDot,
                        { backgroundColor: STATUS_COLORS[item.status] },
                    ]}
                />
                <Text
                    style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}
                >
                    {STATUS_LABELS[item.status]}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Search */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Поиск..."
                    placeholderTextColor="#666"
                    value={search}
                    onChangeText={(text) => dispatch(setSearch(text))}
                />
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        style={[
                            styles.filterButton,
                            filter === f.key && styles.filterButtonActive,
                        ]}
                        onPress={() => dispatch(setFilter(f.key))}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                filter === f.key && styles.filterTextActive,
                            ]}
                        >
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={renderRecording}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={() => dispatch(fetchRecordings())}
                        tintColor="#e94560"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {isLoading ? 'Загрузка...' : 'Нет записей'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    searchInput: {
        backgroundColor: '#2a2a4a',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#fff',
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#2a2a4a',
    },
    filterButtonActive: {
        backgroundColor: '#e94560',
    },
    filterText: {
        color: '#888',
        fontSize: 14,
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
    },
    recordingItem: {
        backgroundColor: '#2a2a4a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recordingInfo: {
        flex: 1,
    },
    recordingDate: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    recordingDuration: {
        color: '#888',
        fontSize: 14,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
});

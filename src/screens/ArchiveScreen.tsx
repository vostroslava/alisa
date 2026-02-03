import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { useGetRecordingsQuery } from '../store/api/recordingsApi';
import { MockRecording } from '../types/mock';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FILTER_TABS = ['All', 'Won', 'Posted', 'Recently Viewed'];

export function ArchiveScreen() {
    const navigation = useNavigation<NavigationProp>();
    const { data: recordings = [], isLoading } = useGetRecordingsQuery();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredRecordings = recordings.filter((rec) => {
        const matchesSearch = rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rec.id.includes(searchQuery);
        const matchesFilter = activeFilter === 'All' || rec.status === activeFilter.toLowerCase();

        if (activeFilter === 'Recently Viewed') return true;

        return matchesSearch && matchesFilter;
    });

    const renderItem = ({ item }: { item: MockRecording }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => navigation.navigate('RecordingDetail', { recordingId: item.id })}
        >
            <View>
                <Text style={styles.itemDate}>{item.date}</Text>
                <Text style={styles.itemId}>#{item.id}</Text>
            </View>
            <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My recordings</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Search"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                    />
                </View>
            </View>

            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    data={FILTER_TABS}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeFilter === item && styles.activeTab,
                            ]}
                            onPress={() => setActiveFilter(item)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeFilter === item && styles.activeTabText,
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.tabsContent}
                />
            </View>

            <FlatList
                data={filteredRecordings}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
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
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
        opacity: 0.5,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    tabsContainer: {
        marginBottom: 10,
    },
    tabsContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    activeTab: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    tabText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
    },
    listContent: {
        paddingTop: 8,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    itemDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    itemId: {
        fontSize: 14,
        color: '#8E8E93',
    },
    arrow: {
        fontSize: 20,
        color: '#C7C7CC',
        fontWeight: '300',
    },
    separator: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginLeft: 20,
    },
});

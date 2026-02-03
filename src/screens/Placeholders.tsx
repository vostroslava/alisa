import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PostedScreen = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Posted Recordings</Text>
    </View>
);

export const ProfileScreen = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Profile</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 18,
        color: '#000',
    },
});

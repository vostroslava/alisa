import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import {
    RecordScreen,
    ArchiveScreen,
    RecordingDetailScreen,
    PostedScreen,
    ProfileScreen,
} from '../screens';

// Icons (Simple shape placeholders for now, in real app use SVGs)
const CircleIcon = ({ focused }: { focused: boolean }) => (
    <View style={[styles.circle, focused && styles.activeCircle]} />
);

export type RootStackParamList = {
    Main: undefined;
    RecordingDetail: { recordingId: string };
};

export type MainTabParamList = {
    Record: undefined;
    Archive: undefined;
    Posted: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: 80,
                    paddingBottom: 20,
                },
                tabBarActiveTintColor: '#000000',
                tabBarInactiveTintColor: '#C4C4C4',
                headerShown: false,
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    marginTop: 5,
                },
            }}
        >
            <Tab.Screen
                name="Record"
                component={RecordScreen}
                options={{
                    tabBarLabel: 'Record',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color }} />
                    ),
                }}
            />
            <Tab.Screen
                name="Archive"
                component={ArchiveScreen}
                options={{
                    tabBarLabel: 'Archive',
                    tabBarIcon: ({ color }) => (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color }} />
                    ),
                }}
            />
            <Tab.Screen
                name="Posted"
                component={PostedScreen}
                options={{
                    tabBarLabel: 'Posted',
                    tabBarIcon: ({ color }) => (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color }} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color }) => (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color }} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#ffffff' },
                }}
            >
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen
                    name="RecordingDetail"
                    component={RecordingDetailScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    circle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#C4C4C4',
    },
    activeCircle: {
        backgroundColor: '#000000',
    },
});

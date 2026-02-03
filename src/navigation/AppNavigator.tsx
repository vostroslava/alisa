import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAppSelector } from '../store/hooks';
import {
    LoginScreen,
    RecordScreen,
    ArchiveScreen,
    RecordingDetailScreen,
} from '../screens';

export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
    RecordingDetail: { recordingId: string };
};

export type MainTabParamList = {
    Record: undefined;
    Archive: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: '#1a1a2e',
                    borderTopColor: '#2a2a4a',
                },
                tabBarActiveTintColor: '#e94560',
                tabBarInactiveTintColor: '#666',
                headerStyle: {
                    backgroundColor: '#1a1a2e',
                },
                headerTintColor: '#fff',
            }}
        >
            <Tab.Screen
                name="Record"
                component={RecordScreen}
                options={{
                    title: 'Запись',
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 24 }}>🎙️</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Archive"
                component={ArchiveScreen}
                options={{
                    title: 'Архив',
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 24 }}>📁</Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export function AppNavigator() {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#1a1a2e',
                    },
                    headerTintColor: '#fff',
                    contentStyle: {
                        backgroundColor: '#1a1a2e',
                    },
                }}
            >
                {!isAuthenticated ? (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                ) : (
                    <>
                        <Stack.Screen
                            name="Main"
                            component={MainTabs}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="RecordingDetail"
                            component={RecordingDetailScreen}
                            options={{ title: 'Запись' }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

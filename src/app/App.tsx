import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../store';
import { AppNavigator } from '../navigation';
import { StatusBar } from 'expo-status-bar';

export default function App() {
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <StatusBar style="dark" />
                <AppNavigator />
            </SafeAreaProvider>
        </Provider>
    );
}

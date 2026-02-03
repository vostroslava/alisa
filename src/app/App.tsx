import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../store';
import { AppNavigator } from '../navigation';
import { authService, uploadQueueService } from '../services';
import { setLoading, loginSuccess } from '../store/slices';

function AppContent() {
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        async function initialize() {
            try {
                // Initialize auth
                const hasTokens = await authService.initialize();
                if (hasTokens) {
                    // If we have tokens, consider user logged in
                    // In a real app, you'd validate the token with the server
                    store.dispatch(
                        loginSuccess({ id: 'cached', email: 'cached@user.com' })
                    );
                }

                // Start upload queue
                await uploadQueueService.start();
            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                store.dispatch(setLoading(false));
                setIsInitializing(false);
            }
        }

        initialize();

        return () => {
            uploadQueueService.stop();
        };
    }, []);

    if (isInitializing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e94560" />
            </View>
        );
    }

    return <AppNavigator />;
}

export default function App() {
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <AppContent />
            </SafeAreaProvider>
        </Provider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
    },
});

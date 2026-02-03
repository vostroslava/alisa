import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginSuccess, loginFailure, clearError } from '../store/slices';
import { authService } from '../services';

export function LoginScreen() {
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            dispatch(loginFailure('Введите email и пароль'));
            return;
        }

        try {
            const user = await authService.login({ email, password });
            dispatch(loginSuccess(user));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ошибка входа';
            dispatch(loginFailure(message));
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Голосовой Диктофон</Text>
                <Text style={styles.subtitle}>Войдите для продолжения</Text>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    onFocus={() => dispatch(clearError())}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Пароль"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                    onFocus={() => dispatch(clearError())}
                />

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Войти</Text>
                    )}
                </TouchableOpacity>

                {/* Consent placeholder */}
                <Text style={styles.consentText}>
                    Входя в приложение, вы соглашаетесь с политикой конфиденциальности и
                    даёте согласие на запись аудио.
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 32,
    },
    input: {
        backgroundColor: '#2a2a4a',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#fff',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#e94560',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    errorContainer: {
        backgroundColor: 'rgba(233, 69, 96, 0.2)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#e94560',
        textAlign: 'center',
    },
    consentText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 18,
    },
});

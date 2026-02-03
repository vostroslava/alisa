// Environment configuration
// Replace with actual values or use react-native-config for env management

export const config = {
    // API
    API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
    API_TIMEOUT_MS: 30000,

    // Recording
    THRESHOLD_SECONDS: 5,
    MAX_RECORDING_DURATION_SEC: 7200, // 2 hours

    // Upload
    MAX_UPLOAD_ATTEMPTS: 5,
    INITIAL_RETRY_DELAY_MS: 1000,
    MAX_CONCURRENT_UPLOADS: 1,

    // Auth
    TOKEN_REFRESH_THRESHOLD_MS: 5 * 60 * 1000, // 5 minutes before expiry
} as const;

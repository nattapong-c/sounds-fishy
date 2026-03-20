import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor for logging
apiClient.interceptors.request.use(
    (config) => {
        // Add auth token here in the future if needed
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Handle common errors
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
            // Request made but no response
            console.error('API Error: No response received', error.request);
        } else {
            // Something else happened
            console.error('API Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// API Methods
export const api = {
    // Room endpoints
    rooms: {
        // Create a new room
        create: async () => {
            const response = await apiClient.post('/rooms');
            return response.data;
        },

        // Get room details
        get: async (roomId: string) => {
            const response = await apiClient.get(`/rooms/${roomId}`);
            return response.data;
        },

        // Join a room
        join: async (roomId: string, name: string, deviceId: string) => {
            const response = await apiClient.post(`/rooms/${roomId}/join`, {
                name,
                deviceId,
            });
            return response.data;
        },

        // Leave a room
        leave: async (roomId: string, deviceId: string) => {
            const response = await apiClient.post(`/rooms/${roomId}/leave`, {
                deviceId,
            });
            return response.data;
        },
    },
};

// Export types
export type { AxiosError };
export { apiClient };

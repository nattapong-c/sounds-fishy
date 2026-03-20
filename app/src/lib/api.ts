/**
 * API Client for Sounds Fishy backend
 * Uses fetch wrapper for type-safe API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
}

/**
 * Room API methods
 */
export const roomAPI = {
    /**
     * Create a new room
     * POST /rooms
     */
    create: async () => {
        return fetchApi<{ roomId: string }>('/rooms', {
            method: 'POST',
        });
    },

    /**
     * Get room info
     * GET /rooms/:roomId
     */
    get: async (roomId: string) => {
        return fetchApi<{ room: any }>(`/rooms/${roomId}`);
    },

    /**
     * Join a room
     * POST /rooms/:roomId/join
     */
    join: async (roomId: string, name: string, deviceId: string) => {
        return fetchApi<{ room: any }>(`/rooms/${roomId}/join`, {
            method: 'POST',
            body: JSON.stringify({ name, deviceId }),
        });
    },

    /**
     * Leave a room
     * POST /rooms/:roomId/leave
     */
    leave: async (roomId: string, deviceId: string) => {
        return fetchApi<{ success: boolean }>(`/rooms/${roomId}/leave`, {
            method: 'POST',
            body: JSON.stringify({ deviceId }),
        });
    },
};

export { fetchApi };

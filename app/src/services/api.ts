import apiClient from '@/lib/api';
import { IGameRoom } from '@/types';

// Request types
export interface CreateRoomData {
  hostName: string;
  deviceId: string;
}

export interface JoinRoomData {
  playerName: string;
  deviceId: string;
}

export interface GenerateLieData {
  roomCode: string;
  deviceId: string;
}

// Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface GenerateLieResponse {
  lieSuggestion: string;
  usedFallback: boolean;
}

/**
 * Room API Service
 * Methods for interacting with room management endpoints
 */
export const roomAPI = {
  /**
   * Create a new room
   */
  createRoom: async (data: CreateRoomData): Promise<ApiResponse<{ roomId: string; roomCode: string; deviceId: string }>> => {
    const response = await apiClient.post('/api/rooms', data);
    return response.data as ApiResponse<{ roomId: string; roomCode: string; deviceId: string }>;
  },

  /**
   * Get room details
   */
  getRoom: async (roomCode: string): Promise<ApiResponse<IGameRoom>> => {
    const response = await apiClient.get(`/api/rooms/${roomCode}`);
    return response.data as ApiResponse<IGameRoom>;
  },

  /**
   * Join a room (new player or reconnection)
   */
  joinRoom: async (roomCode: string, data: JoinRoomData): Promise<ApiResponse<{ deviceId: string; roomCode: string; rejoined: boolean }>> => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/join`, data);
    return response.data as ApiResponse<{ deviceId: string; roomCode: string; rejoined: boolean }>;
  },

  /**
   * Leave a room
   */
  leaveRoom: async (roomCode: string, deviceId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/leave`, { deviceId });
    return response.data as ApiResponse<void>;
  },

  /**
   * Toggle ready status
   */
  toggleReady: async (roomCode: string, deviceId: string): Promise<ApiResponse<{ allReady: boolean }>> => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/ready`, { deviceId });
    return response.data as ApiResponse<{ allReady: boolean }>;
  },

  /**
   * Start game (host only)
   */
  startGame: async (roomCode: string): Promise<ApiResponse<{ roomCode: string; status: string }>> => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/start`);
    return response.data as ApiResponse<{ roomCode: string; status: string }>;
  },

  /**
   * Generate lie for Red Herring (Phase 2)
   */
  generateLie: async (data: GenerateLieData): Promise<ApiResponse<GenerateLieResponse>> => {
    const response = await apiClient.post(`/api/rooms/${data.roomCode}/generate-lie`, {
      deviceId: data.deviceId
    });
    return response.data as ApiResponse<GenerateLieResponse>;
  },

  /**
   * Regenerate AI data (host only, Phase 2)
   */
  regenerateAi: async (roomCode: string, deviceId: string): Promise<ApiResponse<{ aiConfig: any; usedFallback: boolean }>> => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/regenerate-ai`, { deviceId });
    return response.data as ApiResponse<{ aiConfig: any; usedFallback: boolean }>;
  },
};

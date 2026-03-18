import apiClient from '@/lib/axios';
import { IGameRoom } from '@/types';

// Request types
export interface CreateRoomData {
  hostName: string;
}

export interface JoinRoomData {
  playerName: string;
}

// Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const roomAPI = {
  createRoom: async (data: CreateRoomData): Promise<ApiResponse<{ roomId: string; roomCode: string; hostId: string }>> => {
    const response = await apiClient.post('/api/rooms', data);
    return response as ApiResponse<{ roomId: string; roomCode: string; hostId: string }>;
  },

  getRoom: async (roomCode: string): Promise<ApiResponse<IGameRoom>> => {
    const response = await apiClient.get(`/api/rooms/${roomCode}`);
    return response as ApiResponse<IGameRoom>;
  },

  joinRoom: async (roomCode: string, data: JoinRoomData): Promise<ApiResponse<{ playerId: string; roomCode: string }>> => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/join`, data);
    return response as ApiResponse<{ playerId: string; roomCode: string }>;
  },

  leaveRoom: async (roomCode: string, playerId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/leave`, { playerId });
    return response as ApiResponse<void>;
  },

  toggleReady: async (roomCode: string, playerId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/ready`, { playerId });
    return response as ApiResponse<void>;
  },

  startGame: async (roomCode: string): Promise<ApiResponse<{ roomCode: string; status: string }>> => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/start`);
    return response as ApiResponse<{ roomCode: string; status: string }>;
  },
};

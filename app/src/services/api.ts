import apiClient from '@/lib/axios';
import { IGameRoom } from '@/types';

export interface CreateRoomData {
  hostName: string;
}

export interface JoinRoomData {
  playerName: string;
}

export const roomAPI = {
  createRoom: async (data: CreateRoomData) => {
    const response = await apiClient.post('/api/rooms', data);
    return response;
  },

  getRoom: async (roomCode: string): Promise<{ success: boolean; data: IGameRoom }> => {
    const response = await apiClient.get(`/api/rooms/${roomCode}`);
    // Axios interceptor already unwraps response.data, so response is the actual body
    return response as { success: boolean; data: IGameRoom };
  },

  joinRoom: async (roomCode: string, data: JoinRoomData) => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/join`, data);
    return response;
  },

  leaveRoom: async (roomCode: string, playerId: string) => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/leave`, { playerId });
    return response;
  },

  toggleReady: async (roomCode: string, playerId: string) => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/ready`, { playerId });
    return response;
  },

  startGame: async (roomCode: string) => {
    const response = await apiClient.post(`/api/rooms/${roomCode}/start`);
    return response;
  },
};

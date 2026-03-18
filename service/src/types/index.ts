// Centralized type definitions
// Re-exports from models folder to maintain single source of truth

// Import all model interfaces first
import type { IGameRoom, IPlayer } from '../models/game-room';

// Re-export all model interfaces
export { IPlayer, IGameRoom } from '../models/game-room';

// Type aliases for convenience
export type PlayerRole = 'guesser' | 'bigFish' | 'redHerring' | 'host';
export type GameStatus = 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary' | 'completed';

// Socket events types
export interface SocketEvents {
  // Client → Server
  'join_room': { roomCode: string; playerId: string };
  'leave_room': { roomCode: string; playerId: string };
  'ready_up': { roomCode: string; playerId: string };
  'start_game': { roomCode: string };

  // Server → Client
  'room_updated': IGameRoom;
  'player_joined': { playerId: string; playerName: string; playerCount: number };
  'player_left': { playerId: string; playerName: string; remainingCount: number };
  'game_started': { roomCode: string; status: 'briefing' };
  'error': { code: string; message: string };
}

// API Request/Response types
export interface CreateRoomRequest {
  hostName: string;
}

export interface CreateRoomResponse {
  success: boolean;
  data: {
    roomId: string;
    roomCode: string;
    hostId: string;
  };
}

export interface JoinRoomRequest {
  playerName: string;
}

export interface JoinRoomResponse {
  success: boolean;
  data: {
    playerId: string;
    roomCode: string;
  };
}

export interface GetRoomResponse {
  success: boolean;
  data: IGameRoom;
}

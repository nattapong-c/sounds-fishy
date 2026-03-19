// TypeScript type definitions for Sounds Fishy

/**
 * Player role in the game
 */
export type PlayerRole = 'guesser' | 'bigFish' | 'redHerring' | null;

/**
 * Game room status
 */
export type RoomStatus = 'lobby' | 'briefing' | 'playing' | 'roundEnd';

/**
 * Player interface
 */
export interface IPlayer {
  deviceId: string;
  name: string;
  isHost: boolean;
  inGameRole: PlayerRole;
  isOnline: boolean;
  lastSeen: string;
  score: number;
  isReady: boolean;
  generatedLie?: string | null;
}

/**
 * AI configuration for round data
 */
export interface IAiConfig {
  question: string;
  correctAnswer: string;
  bluffSuggestions: string[];
  generatedAt: string;
  model?: string;
}

/**
 * Game room interface
 */
export interface IGameRoom {
  _id: string;
  roomCode: string;
  hostId: string;
  players: IPlayer[];
  status: RoomStatus;
  question?: string;
  secretWord?: string;
  aiConfig?: IAiConfig;
  createdAt: string;
  updatedAt: string;
}

/**
 * WebSocket message interface
 */
export interface WSMessage {
  type: string;
  data: any;
}

/**
 * API Response type
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

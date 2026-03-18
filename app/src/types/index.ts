// Game role (separate from host flag)
export type InGameRole = 'guesser' | 'bigFish' | 'redHerring' | null;
export type GameStatus = 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary' | 'completed';

export interface IPlayer {
  playerId: string;
  name: string;
  isHost: boolean;                    // Separate host flag
  inGameRole: InGameRole;             // Game role (separate from host)
  isOnline: boolean;                  // Connection status
  score: number;
  isReady: boolean;
  lastSeen?: string;                  // Last activity timestamp
}

export interface IGameRoom {
  _id?: string;
  roomCode: string;
  hostId: string;
  status: GameStatus;
  players: IPlayer[];
  currentRound: number;
  createdAt?: string;
  updatedAt?: string;
}

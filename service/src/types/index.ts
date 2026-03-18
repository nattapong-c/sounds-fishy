export type PlayerRole = 'guesser' | 'bigFish' | 'redHerring' | 'host';
export type GameStatus = 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary' | 'completed';

export interface IPlayer {
  playerId: string;
  name: string;
  role: PlayerRole;
  score: number;
  isReady: boolean;
  generatedLie?: string;
  eliminatedInRound?: number;
}

export interface IGameRoom {
  _id?: string;
  roomCode: string;
  hostId: string;
  status: GameStatus;
  players: IPlayer[];
  currentRound: number;
  secretWord?: string;
  question?: string;
  eliminatedPlayers?: Array<{
    playerId: string;
    round: number;
    wasBigFish: boolean;
  }>;
  roundHistory?: Array<{
    roundNumber: number;
    secretWord: string;
    question: string;
    guesserScore: number;
    bigFishScore: number;
    redHerringScores: number[];
    bustOccurred: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

// Socket events
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

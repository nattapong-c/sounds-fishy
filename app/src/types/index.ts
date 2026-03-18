export type PlayerRole = 'guesser' | 'bigFish' | 'redHerring' | 'host';
export type GameStatus = 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary' | 'completed';

export interface IPlayer {
  playerId: string;
  name: string;
  role: PlayerRole;
  score: number;
  isReady: boolean;
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

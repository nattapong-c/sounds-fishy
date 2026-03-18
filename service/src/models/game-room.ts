import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer {
  playerId: string;
  name: string;
  isHost: boolean;                    // Separate host flag
  inGameRole: 'guesser' | 'bigFish' | 'redHerring' | null; // Game role (separate from host)
  isOnline: boolean;                  // Connection status
  score: number;
  isReady: boolean;
  generatedLie?: string;
  eliminatedInRound?: number;
  lastSeen?: Date;                    // Last activity timestamp
}

export interface IGameRoom extends Document {
  roomCode: string;
  hostId: string;
  status: 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary' | 'completed';
  players: IPlayer[];
  currentRound: number;
  secretWord?: string;
  question?: string;
  eliminatedPlayers: Array<{
    playerId: string;
    round: number;
    wasBigFish: boolean;
  }>;
  roundHistory: Array<{
    roundNumber: number;
    secretWord: string;
    question: string;
    guesserScore: number;
    bigFishScore: number;
    redHerringScores: number[];
    bustOccurred: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  playerId: { type: String, required: true },
  name: { type: String, required: true },
  isHost: { type: Boolean, default: false },  // Separate host flag
  inGameRole: {
    type: String,
    enum: ['guesser', 'bigFish', 'redHerring', null],
    default: null
  },
  isOnline: { type: Boolean, default: false }, // Connection status
  score: { type: Number, default: 0 },
  isReady: { type: Boolean, default: false },
  generatedLie: { type: String },
  eliminatedInRound: { type: Number },
  lastSeen: { type: Date, default: Date.now }  // Activity tracking
});

const GameRoomSchema = new Schema<IGameRoom>({
  roomCode: { type: String, required: true, unique: true, uppercase: true },
  hostId: { type: String, required: true },
  status: {
    type: String,
    enum: ['lobby', 'briefing', 'pitch', 'elimination', 'round_summary', 'completed'],
    default: 'lobby'
  },
  players: [PlayerSchema],
  currentRound: { type: Number, default: 1 },
  secretWord: { type: String },
  question: { type: String },
  eliminatedPlayers: [{
    playerId: String,
    round: Number,
    wasBigFish: Boolean
  }],
  roundHistory: [{
    roundNumber: Number,
    secretWord: String,
    question: String,
    guesserScore: Number,
    bigFishScore: Number,
    redHerringScores: [Number],
    bustOccurred: Boolean
  }]
}, { timestamps: true });

export default mongoose.model<IGameRoom>('GameRoom', GameRoomSchema);

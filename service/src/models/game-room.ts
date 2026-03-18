import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer {
  playerId: string;
  name: string;
  role: 'guesser' | 'bigFish' | 'redHerring' | 'host';
  score: number;
  isReady: boolean;
  generatedLie?: string;
  eliminatedInRound?: number;
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
  role: {
    type: String,
    enum: ['guesser', 'bigFish', 'redHerring', 'host'],
    default: 'host'
  },
  score: { type: Number, default: 0 },
  isReady: { type: Boolean, default: false },
  generatedLie: { type: String },
  eliminatedInRound: { type: Number }
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

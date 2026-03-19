import mongoose, { Document, Schema } from 'mongoose';

/**
 * Player subdocument interface
 */
export interface IPlayer {
  deviceId: string;
  name: string;
  isHost: boolean;
  inGameRole: 'guesser' | 'bigFish' | 'redHerring' | null;
  isOnline: boolean;
  lastSeen: Date;
  score: number;
  isReady: boolean;
  generatedLie?: string | null;
}

/**
 * AI configuration interface
 */
export interface IAiConfig {
  question: string;
  correctAnswer: string;
  bluffSuggestions: string[];
  generatedAt: Date;
  model?: string;
}

/**
 * Game room document interface
 */
export interface IGameRoom extends Document {
  roomCode: string;
  hostId: string;
  players: IPlayer[];
  status: 'lobby' | 'briefing' | 'playing' | 'roundEnd';
  question?: string;
  secretWord?: string;
  aiConfig?: IAiConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Player schema
 * Note: deviceId is used for persistent identity (same device = same player)
 */
const playerSchema = new Schema<IPlayer>({
  deviceId: {
    type: String,
    required: true,
    index: true,  // Index for fast player lookups by deviceId
  },
  name: {
    type: String,
    required: true,
  },
  isHost: {
    type: Boolean,
    default: false,
  },
  inGameRole: {
    type: String,
    enum: ['guesser', 'bigFish', 'redHerring', null],
    default: null,
  },
  isOnline: {
    type: Boolean,
    default: true,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  score: {
    type: Number,
    default: 0,
  },
  isReady: {
    type: Boolean,
    default: false,
  },
  generatedLie: {
    type: String,
    default: null,
  },
});

/**
 * Game room schema
 */
const gameRoomSchema = new Schema<IGameRoom>({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,  // Index for fast room lookups
  },
  hostId: {
    type: String,
    required: true,
  },
  players: {
    type: [playerSchema],
    default: [],
    validate: {
      validator: (players: IPlayer[]) => players.length <= 8,
      message: 'Room cannot have more than 8 players',
    },
  },
  status: {
    type: String,
    enum: ['lobby', 'briefing', 'playing', 'roundEnd'],
    default: 'lobby',
  },
  question: {
    type: String,
    default: undefined,
  },
  secretWord: {
    type: String,
    default: undefined,
  },
  aiConfig: {
    type: {
      question: String,
      correctAnswer: String,
      bluffSuggestions: [String],
      generatedAt: Date,
      model: String,
    },
    default: undefined,
  },
}, {
  timestamps: true,  // Automatically adds createdAt and updatedAt
});

// TTL Index - Auto-delete rooms after 24 hours of inactivity
gameRoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

// Compound index for efficient queries
gameRoomSchema.index({ roomCode: 1, status: 1 });

// Export model
export default mongoose.model<IGameRoom>('GameRoom', gameRoomSchema);

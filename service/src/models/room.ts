import mongoose, { Document, Schema } from 'mongoose';

/**
 * Player subdocument schema
 * Represents a player in a room with persistent identity via deviceId
 */
export interface IPlayer {
    id: string;
    name: string;
    deviceId: string;
    isAdmin: boolean;
    isOnline: boolean;
    inGameRole?: 'guesser' | 'blueFish' | 'redFish' | null;
}

export type PlayerType = IPlayer;

const PlayerSchema = new Schema<IPlayer>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    deviceId: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    inGameRole: {
        type: String,
        enum: ['guesser', 'blueFish', 'redFish'],
        default: null
    }
}, { _id: false });

/**
 * Room document schema
 * Represents a game room with players and game state
 */
export interface IRoom extends Document {
    roomId: string;
    status: 'lobby' | 'playing' | 'guessing' | 'round_end' | 'completed';
    players: IPlayer[];
    lastGuesserId?: string | null;
    currentRound?: number;
    question?: string | null;
    correctAnswer?: string | null;
    fakeAnswersDistribution?: Map<string, string>; // playerId -> fakeAnswer
    eliminatedPlayers?: string[]; // playerIds already eliminated
    currentTempPoints?: number; // Guesser's temporary points
    scores?: Map<string, {
        totalPoints: number;
        tempPoints: number;
        roundsAsGuesser: number;
        roundsAsBlueFish: number;
        roundsAsRedFish: number;
    }>;
    gameHistory?: Array<{
        round: number;
        guesserId: string;
        blueFishId: string;
        redFishIds: string[];
        winner: 'guesser' | 'blueFish' | 'redFish';
        pointsAwarded: number;
    }>;
    expiresAt?: Date; // Room expiration time (12 hours after creation)
    createdAt: Date;
    updatedAt: Date;
    // Instance methods
    getPointsBreakdown(): any[] | null;
    getRankings(): any[];
}

export const RoomSchema = new Schema<IRoom>({
    roomId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['lobby', 'playing', 'guessing', 'round_end', 'completed'],
        default: 'lobby'
    },
    players: {
        type: [PlayerSchema],
        default: []
    },
    lastGuesserId: {
        type: String,
        default: null
    },
    currentRound: {
        type: Number,
        default: 1
    },
    question: {
        type: String,
        default: null
    },
    correctAnswer: {
        type: String,
        default: null
    },
    fakeAnswersDistribution: {
        type: Map,
        of: String
    },
    eliminatedPlayers: {
        type: [String],
        default: []
    },
    currentTempPoints: {
        type: Number,
        default: 0
    },
    scores: {
        type: Map,
        of: new Schema({
            totalPoints: { type: Number, default: 0 },
            tempPoints: { type: Number, default: 0 },
            roundsAsGuesser: { type: Number, default: 0 },
            roundsAsBlueFish: { type: Number, default: 0 },
            roundsAsRedFish: { type: Number, default: 0 }
        }, { _id: false })
    },
    gameHistory: {
        type: [{
            round: Number,
            guesserId: String,
            blueFishId: String,
            redFishIds: [String],
            winner: { type: String, enum: ['guesser', 'blueFish', 'redFish'] },
            pointsAwarded: Number
        }],
        default: []
    }
}, {
    timestamps: true
});

// Index for deviceId lookups (for reconnection)
RoomSchema.index({ 'players.deviceId': 1 });

// TTL Index - automatically delete rooms after 12 hours (43200 seconds)
// MongoDB will automatically remove expired documents
RoomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 }); // 12 hours = 43200 seconds

// Pre-save hook to set expiresAt
RoomSchema.pre('save', function(next) {
    if (this.isNew) {
        // Set expiration time for new rooms (12 hours from now)
        this.expiresAt = new Date(Date.now() + 43200000); // 12 hours in milliseconds
    }
    next();
});

// Add toJSON method to convert Map to object
RoomSchema.methods.toJSON = function() {
    const obj = this.toObject();
    // Convert scores Map to plain object
    if (obj.scores instanceof Map) {
        obj.scores = Object.fromEntries(obj.scores);
    }
    // Convert fakeAnswersDistribution Map to plain object
    if (obj.fakeAnswersDistribution instanceof Map) {
        obj.fakeAnswersDistribution = Object.fromEntries(obj.fakeAnswersDistribution);
    }
    // Ensure currentTempPoints is always included
    obj.currentTempPoints = obj.currentTempPoints || 0;
    // Include expiresAt for debugging/logging
    if (obj.expiresAt) {
        obj.expiresAt = obj.expiresAt.toISOString();
    }
    return obj;
};

/**
 * Get points breakdown for current round (if round ended)
 */
RoomSchema.methods.getPointsBreakdown = function() {
    if (this.status !== 'round_end' || !this.scores) {
        return null;
    }
    
    const { generatePointsBreakdown } = require('../game/scoring');
    const winner = this.eliminatedPlayers?.length === this.players.filter((p: any) => p.inGameRole === 'redFish').length 
        ? 'guesser' 
        : 'redFish';
    
    return generatePointsBreakdown(
        this.players,
        this.scores,
        winner,
        this.currentTempPoints || 0
    );
};

/**
 * Get rankings from scores
 */
RoomSchema.methods.getRankings = function() {
    if (!this.scores) {
        return [];
    }
    
    const { calculateRankings } = require('../game/scoring');
    return calculateRankings(this.players, this.scores);
};

/**
 * Room model for MongoDB
 */
export const RoomModel = mongoose.model<IRoom>('Room', RoomSchema);

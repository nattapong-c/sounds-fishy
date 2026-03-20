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
    question?: string | null;
    correctAnswer?: string | null;
    scores?: Map<string, { 
        totalPoints: number; 
        tempPoints: number;
        roundsAsGuesser: number;
        roundsAsBlueFish: number;
        roundsAsRedFish: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>({
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
    question: { 
        type: String, 
        default: null 
    },
    correctAnswer: { 
        type: String, 
        default: null 
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
    }
}, {
    timestamps: true
});

// Index for fast roomId lookups
RoomSchema.index({ roomId: 1 });

// Index for deviceId lookups (for reconnection)
RoomSchema.index({ 'players.deviceId': 1 });

// Add toJSON method to convert Map to object
RoomSchema.methods.toJSON = function() {
    const obj = this.toObject();
    // Convert scores Map to plain object
    if (obj.scores instanceof Map) {
        obj.scores = Object.fromEntries(obj.scores);
    }
    return obj;
};

/**
 * Room model for MongoDB
 */
export const RoomModel = mongoose.model<IRoom>('Room', RoomSchema);

/**
 * Helper function to convert room document to plain object with toJSON
 */
export function roomToJSON(room: IRoom): any {
    const roomObj = room.toObject();
    // Convert scores Map to plain object
    if (roomObj.scores) {
        roomObj.scores = Object.fromEntries(roomObj.scores);
    }
    return roomObj;
}

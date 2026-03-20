import { Elysia, t } from 'elysia';
import { RoomModel, IPlayer } from '../models/room';
import { logger } from '../lib/logger';
import crypto from 'crypto';

/**
 * Room Controller
 * REST API endpoints for room management
 */

/**
 * Generate a unique 6-character room ID
 */
function generateRoomId(): string {
    return crypto.randomUUID().substring(0, 6).toUpperCase();
}

/**
 * Create a new room
 * POST /rooms
 */
export async function createRoom() {
    const roomId = generateRoomId();
    
    const newRoom = new RoomModel({
        roomId,
        status: 'lobby',
        players: [],
        lastGuesserId: null,
        question: null,
        correctAnswer: null,
        scores: new Map()
    });
    
    await newRoom.save();
    logger.info({ roomId }, 'New room created');
    
    return { roomId };
}

/**
 * Join a room
 * POST /rooms/:roomId/join
 */
export async function joinRoom(
    roomId: string,
    body: { name: string; deviceId: string }
) {
    const { name, deviceId } = body;
    
    const room = await RoomModel.findOne({ roomId });
    
    if (!room) {
        logger.warn({ roomId, deviceId }, 'Failed to join: Room not found');
        return { error: 'Room not found', status: 404 };
    }
    
    // Check for reconnection
    const existingPlayer = room.players.find(p => p.deviceId === deviceId);
    
    if (existingPlayer) {
        // Reconnecting player
        existingPlayer.isOnline = true;
        if (name) existingPlayer.name = name;
        await room.save();
        
        logger.info({ roomId, deviceId }, 'Player reconnected to room');
        return { room: room.toJSON() };
    }
    
    // New player - check if room is full
    if (room.players.length >= 8) {
        logger.warn({ roomId, deviceId }, 'Failed to join: Room is full');
        return { error: 'Room is full', status: 400 };
    }
    
    // Create new player
    const newPlayer: IPlayer = {
        id: crypto.randomUUID(),
        name: name || `Player ${room.players.length + 1}`,
        deviceId,
        isAdmin: room.players.length === 0, // First player is admin
        isOnline: true,
        inGameRole: null
    };
    
    room.players.push(newPlayer);
    
    // Initialize score for new player
    if (!room.scores) {
        room.scores = new Map();
    }
    room.scores.set(newPlayer.id, {
        totalPoints: 0,
        tempPoints: 0,
        roundsAsGuesser: 0,
        roundsAsBlueFish: 0,
        roundsAsRedFish: 0
    });
    
    await room.save();
    logger.info({ roomId, playerId: newPlayer.id, playerName: name }, 'Player joined room');
    
    return { room: room.toJSON() };
}

/**
 * Leave a room
 * POST /rooms/:roomId/leave
 */
export async function leaveRoom(
    roomId: string,
    body: { deviceId: string }
) {
    const { deviceId } = body;
    
    const room = await RoomModel.findOne({ roomId });
    
    if (!room) {
        logger.warn({ roomId, deviceId }, 'Failed to leave: Room not found');
        return { error: 'Room not found', status: 404 };
    }
    
    const initialLength = room.players.length;
    const leavingPlayer = room.players.find(p => p.deviceId === deviceId);
    
    room.players = room.players.filter(p => p.deviceId !== deviceId);
    
    if (room.players.length !== initialLength) {
        if (room.players.length === 0) {
            // Last player left - delete room
            await RoomModel.deleteOne({ roomId });
            logger.info({ roomId }, 'Room deleted because all players left');
        } else {
            // Reassign admin if leaving player was admin
            if (leavingPlayer?.isAdmin && !room.players.some(p => p.isAdmin)) {
                room.players[0].isAdmin = true;
                logger.info({ roomId }, 'Admin role reassigned');
            }
            await room.save();
        }
    }
    
    logger.info({ roomId, deviceId }, 'Player left room');
    return { success: true };
}

/**
 * Get room info
 * GET /rooms/:roomId
 */
export async function getRoom(roomId: string) {
    const room = await RoomModel.findOne({ roomId });
    
    if (!room) {
        logger.warn({ roomId }, 'Room not found');
        return { error: 'Room not found', status: 404 };
    }
    
    return { room: room.toJSON() };
}

/**
 * Room controller routes
 */
export const roomController = new Elysia()
    .group('/rooms', (app) =>
        app
            // Create room
            .post('/', async () => {
                return await createRoom();
            })
            
            // Get room
            .get('/:roomId', async ({ params, set }) => {
                const result = await getRoom(params.roomId);
                if ((result as any).error) {
                    set.status = (result as any).status;
                    return (result as any).error;
                }
                return result;
            })
            
            // Join room
            .post('/:roomId/join', async ({ params, body, set }) => {
                const result = await joinRoom(params.roomId, body as { name: string; deviceId: string });
                if ((result as any).error) {
                    set.status = (result as any).status;
                    return (result as any).error;
                }
                return result;
            })
            
            // Leave room
            .post('/:roomId/leave', async ({ params, body, set }) => {
                const result = await leaveRoom(params.roomId, body as { deviceId: string });
                if ((result as any).error) {
                    set.status = (result as any).status;
                    return (result as any).error;
                }
                return result;
            })
    );

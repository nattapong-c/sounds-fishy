import { Elysia, t } from 'elysia';
import { RoomModel, IPlayer } from '../models/room';
import crypto from 'crypto';
import { logger } from '../lib/logger';

/**
 * Room Controller
 * REST API endpoints for room management
 */

export const roomController = new Elysia({ prefix: '/rooms' })
    /**
     * Create a new room
     * POST /rooms
     */
    .post('/', async () => {
        const roomId = crypto.randomUUID().substring(0, 6).toUpperCase();

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
    }, {
        response: t.Object({ roomId: t.String() })
    })

    /**
     * Get room info
     * GET /rooms/:roomId
     */
    .get('/:roomId', async ({ params: { roomId }, set }) => {
        const room = await RoomModel.findOne({ roomId });
        if (!room) {
            logger.warn({ roomId }, 'Room not found');
            set.status = 404;
            return 'Room not found';
        }
        return { room: room.toJSON() };
    }, {
        params: t.Object({ roomId: t.String() })
    })

    /**
     * Join a room
     * POST /rooms/:roomId/join
     */
    .post('/:roomId/join', async ({ params: { roomId }, body, set }) => {
        const { name, deviceId } = body;
        const room = await RoomModel.findOne({ roomId });

        if (!room) {
            logger.warn({ roomId, deviceId }, 'Failed to join: Room not found');
            set.status = 404;
            return 'Room not found';
        }

        const existingPlayer = room.players.find(p => p.deviceId === deviceId);

        if (existingPlayer) {
            // Reconnecting player
            existingPlayer.isOnline = true;
            if (name) existingPlayer.name = name;
            await room.save();
            logger.info({ roomId, deviceId, name: existingPlayer.name }, 'Player reconnected to room');
            return { room: room.toJSON() };
        }

        // New player - check if room is full
        if (room.players.length >= 8) {
            logger.warn({ roomId, deviceId }, 'Failed to join: Room is full');
            set.status = 400;
            return 'Room is full';
        }

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
        logger.info({ roomId, playerId: newPlayer.id, playerName: name, isAdmin: newPlayer.isAdmin }, 'New player joined room');

        return { room: room.toJSON() };
    }, {
        params: t.Object({ roomId: t.String() }),
        body: t.Object({ name: t.String(), deviceId: t.String() })
    })

    /**
     * Leave a room
     * POST /rooms/:roomId/leave
     */
    .post('/:roomId/leave', async ({ params: { roomId }, body, set }) => {
        const { deviceId } = body;
        const room = await RoomModel.findOne({ roomId });

        if (!room) {
            logger.warn({ roomId, deviceId }, 'Failed to leave: Room not found');
            set.status = 404;
            return 'Room not found';
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
                    logger.info({ roomId, newAdminDeviceId: room.players[0].deviceId }, 'Admin role reassigned');
                }
                await room.save();
            }
            logger.info({ roomId, deviceId }, 'Player left room');
        }

        return { success: true };
    }, {
        params: t.Object({ roomId: t.String() }),
        body: t.Object({ deviceId: t.String() }),
        response: {
            200: t.Object({ success: t.Boolean() }),
            404: t.String()
        }
    });

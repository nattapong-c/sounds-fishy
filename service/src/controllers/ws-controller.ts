import { Elysia, t } from 'elysia';
import { RoomModel } from '../models/room';
import { logger } from '../lib/logger';

/**
 * WebSocket Controller
 * Real-time communication for room updates
 *
 * Note: Phase 1.1 - No timers, players proceed at their own pace
 */

export const wsController = new Elysia({ prefix: '/ws/rooms' })
    .ws('/:roomId', {
        body: t.Any(),
        query: t.Object({ deviceId: t.String() }),
        async open(ws) {
            const { roomId } = ws.data.params;
            const { deviceId } = ws.data.query;

            // Subscribe to room channel
            ws.subscribe(`room:${roomId}`);
            logger.info({ roomId, deviceId, subscribers: ws.subscribers }, 'WebSocket connected and subscribed to room channel');

            const room = await RoomModel.findOne({ roomId });
            if (!room) {
                logger.warn({ roomId, deviceId }, 'Room not found for WebSocket connection');
                return;
            }

            const player = room.players.find(p => p.deviceId === deviceId);
            if (!player) {
                logger.warn({ roomId, deviceId }, 'Player not found in room for WebSocket');
                return;
            }

            // Mark player as online
            player.isOnline = true;
            await room.save();

            // Send current room state to this player
            const roomState = JSON.stringify({
                type: 'room_state_update',
                room: room.toJSON()
            });
            
            // Broadcast to ALL players in the room (including self)
            const broadcastCount = ws.publish(`room:${roomId}`, roomState);
            logger.info({ roomId, deviceId, broadcastCount }, 'Broadcasted room state to room channel');
            
            // Also send directly to ensure this player receives it
            ws.send(roomState);
        },
        async message(ws, message: any) {
            const { roomId } = ws.data.params;
            const { deviceId } = ws.data.query;

            let parsedMessage = message;
            if (typeof message === 'string') {
                try {
                    parsedMessage = JSON.parse(message);
                } catch(e) {
                    logger.warn({ roomId, deviceId }, 'Invalid WebSocket message format');
                    return;
                }
            }

            const room = await RoomModel.findOne({ roomId });
            if (!room) {
                logger.warn({ roomId }, 'Room not found for WebSocket message');
                return;
            }

            const player = room.players.find(p => p.deviceId === deviceId);
            if (!player) {
                logger.warn({ roomId, deviceId }, 'Player not found in room');
                return;
            }

            // Admin Actions
            if (player.isAdmin) {
                /**
                 * Start Game (Phase 2 stub)
                 */
                if (parsedMessage.type === 'start_game') {
                    if (!parsedMessage.hostPlayerId) {
                        logger.warn({ roomId, deviceId }, 'Admin tried to start game without selecting host');
                        ws.send(JSON.stringify({ 
                            type: 'error', 
                            message: 'Host selection required' 
                        }));
                        return;
                    }

                    const hostPlayer = room.players.find(p => p.id === parsedMessage.hostPlayerId);
                    if (!hostPlayer) {
                        logger.warn({ roomId, deviceId, hostPlayerId: parsedMessage.hostPlayerId }, 'Selected host not found');
                        ws.send(JSON.stringify({ 
                            type: 'error', 
                            message: 'Host player not found' 
                        }));
                        return;
                    }

                    // Validate minimum players (4 for Sounds Fishy)
                    if (room.players.length < 4) {
                        ws.send(JSON.stringify({ 
                            type: 'error', 
                            message: 'Need at least 4 players to start' 
                        }));
                        return;
                    }

                    logger.info({ 
                        roomId, 
                        deviceId, 
                        hostPlayerId: parsedMessage.hostPlayerId
                    }, 'Admin started game (Phase 2 stub)');

                    ws.send(JSON.stringify({
                        type: 'game_started',
                        room: room.toJSON(),
                        message: 'Game logic will be implemented in Phase 2'
                    }));
                }

                /**
                 * End Round
                 */
                else if (parsedMessage.type === 'end_round') {
                    logger.info({ roomId, deviceId }, 'Admin ended the round');
                    
                    room.status = 'lobby';
                    room.players.forEach(p => {
                        p.inGameRole = null;
                    });
                    room.question = null;
                    room.correctAnswer = null;
                    await room.save();

                    const updatePayload = JSON.stringify({ 
                        type: 'room_state_update', 
                        room: room.toJSON() 
                    });
                    ws.publish(`room:${roomId}`, updatePayload);
                    ws.send(updatePayload);
                }

                /**
                 * Kick Player
                 */
                else if (parsedMessage.type === 'kick_player') {
                    const targetPlayerId = parsedMessage.targetPlayerId;
                    
                    // Cannot kick admin
                    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
                    if (targetPlayer?.isAdmin) {
                        ws.send(JSON.stringify({ 
                            type: 'error', 
                            message: 'Cannot kick admin' 
                        }));
                        return;
                    }

                    logger.info({ 
                        roomId, 
                        adminDeviceId: deviceId, 
                        targetPlayerId 
                    }, 'Admin kicked player');
                    
                    room.players = room.players.filter(p => p.id !== targetPlayerId);
                    await room.save();
                    
                    const updatePayload = JSON.stringify({ 
                        type: 'room_state_update', 
                        room: room.toJSON() 
                    });
                    ws.publish(`room:${roomId}`, updatePayload);
                    ws.send(updatePayload);
                }
            }

            /**
             * Submit Guess (Phase 2 - stub)
             */
            if (parsedMessage.type === 'submit_guess') {
                logger.info({ roomId, deviceId, guess: parsedMessage.targetPlayerId }, 'Guess submitted (Phase 2 stub)');
                ws.send(JSON.stringify({
                    type: 'guess_submitted',
                    message: 'Scoring will be implemented in Phase 2'
                }));
            }
        },
        async close(ws) {
            const { roomId } = ws.data.params;
            const { deviceId } = ws.data.query;

            logger.info({ roomId, deviceId }, 'WebSocket disconnected');

            const room = await RoomModel.findOne({ roomId });
            if (room) {
                const player = room.players.find(p => p.deviceId === deviceId);
                if (player) {
                    player.isOnline = false;
                    await room.save();
                }
              
                ws.publish(`room:${roomId}`, JSON.stringify({ type: 'room_state_update', room: room.toJSON() }));
            }
        }
    });

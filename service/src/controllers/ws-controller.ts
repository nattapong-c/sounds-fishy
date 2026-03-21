import { Elysia, t } from 'elysia';
import { RoomModel } from '../models/room';
import { logger } from '../lib/logger';
import { getRandomQuestion } from '../services/question-bank-service';
import { assignRoles } from '../game/roles';

type GameRole = 'guesser' | 'blueFish' | 'redFish';

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
                 * Start Game
                 * Assign roles, get question, distribute to players
                 */
                if (parsedMessage.type === 'start_game') {
                    // Validate minimum players (4 for Sounds Fishy)
                    if (room.players.length < 4) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Need at least 4 players to start'
                        }));
                        return;
                    }

                    logger.info({ roomId, deviceId }, 'Admin started game');

                    // Assign roles
                    const roleAssignment = assignRoles(room.players, room.lastGuesserId);
                    
                    // Update player roles in room
                    room.players.forEach(p => {
                        const role = roleAssignment.assignments.get(p.id);
                        if (role) {
                            p.inGameRole = role;
                        }
                    });

                    // Get random question
                    const questionData = await getRandomQuestion('english', 'medium');
                    if (!questionData) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Failed to get question'
                        }));
                        return;
                    }

                    // Update room state
                    room.status = 'playing';
                    room.question = questionData.question;
                    room.correctAnswer = questionData.correctAnswer;
                    room.lastGuesserId = roleAssignment.guesserId;
                    room.currentRound = room.currentRound || 1;
                    room.eliminatedPlayers = [];
                    room.currentTempPoints = 0;

                    // Distribute fake answers to Red Fish (each gets unique one)
                    const fakeAnswersDistribution = new Map<string, string>();
                    const shuffledFakes = [...questionData.fakeAnswers].sort(() => 0.5 - Math.random());
                    roleAssignment.redFishIds.forEach((playerId, index) => {
                        const fakeAnswer = shuffledFakes[index % shuffledFakes.length];
                        fakeAnswersDistribution.set(playerId, fakeAnswer);
                    });
                    room.fakeAnswersDistribution = fakeAnswersDistribution;

                    await room.save();
                    logger.info({
                        roomId,
                        guesserId: roleAssignment.guesserId,
                        blueFishId: roleAssignment.blueFishId,
                        redFishCount: roleAssignment.redFishIds.length
                    }, 'Game started with roles assigned');

                    // Build player-specific data map
                    const playerDataMap: Record<string, {
                        role: GameRole;
                        question: string;
                        correctAnswer?: string;
                        fakeAnswer?: string;
                        lieSuggestion?: string;
                    }> = {};

                    // Guesser data
                    playerDataMap[roleAssignment.guesserId] = {
                        role: 'guesser',
                        question: room.question!
                    };

                    // Blue Fish data
                    playerDataMap[roleAssignment.blueFishId] = {
                        role: 'blueFish',
                        question: room.question!,
                        correctAnswer: room.correctAnswer!
                    };

                    // Red Fish data (reuse shuffledFakes from above)
                    roleAssignment.redFishIds.forEach((playerId, index) => {
                        const fakeAnswer = shuffledFakes[index % shuffledFakes.length];
                        const lieSuggestion = questionData.fakeAnswers.find(a => a !== fakeAnswer);
                        playerDataMap[playerId] = {
                            role: 'redFish',
                            question: room.question!,
                            fakeAnswer,
                            lieSuggestion
                        };
                    });

                    // Broadcast single message with all player data
                    // Each client will extract their own data based on deviceId
                    const payload = {
                        type: 'game_started',
                        room: room.toJSON(),
                        playerDataMap // Each player finds their own data
                    };

                    // Broadcast to all players in the room
                    ws.publish(`room:${roomId}`, JSON.stringify(payload));
                    
                    // Also send directly to ensure admin (who clicked start) receives it
                    ws.send(JSON.stringify(payload));
                    
                    logger.info({ roomId, playerCount: room.players.length }, 'Broadcasted game start to all players');
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

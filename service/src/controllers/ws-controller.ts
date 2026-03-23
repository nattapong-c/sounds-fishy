import { Elysia, t } from 'elysia';
import { RoomModel } from '../models/room';
import { logger } from '../lib/logger';
import { getRandomQuestion } from '../services/question-bank-service';
import { assignRoles } from '../game/roles';
import { calculateGuesserScore, awardRoundPoints, updateRoleCounts, determineRoundWinner, calculateRankings, generatePointsBreakdown } from '../game/scoring';

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
            logger.info({ roomId, deviceId }, 'WebSocket connected and subscribed to room channel');

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

            // Send current room state
            const roomState = JSON.stringify({
                type: 'room_state_update',
                room: room.toJSON()
            });

            // Broadcast to ALL players in the room (including self)
            const broadcastCount = ws.publish(`room:${roomId}`, roomState);
            logger.info({ roomId, deviceId, broadcastCount }, 'Broadcasted room state to room channel');

            // Also send directly to ensure this player receives it
            ws.send(roomState);

            // If game is in progress, send player their role-specific data
            if (room.status === 'playing' && player.inGameRole && room.question) {
                let payload: any = {
                    type: 'game_started',
                    role: player.inGameRole,
                    question: room.question,
                    room: room.toJSON()
                };

                if (player.inGameRole === 'blueFish') {
                    payload.correctAnswer = room.correctAnswer;
                } else if (player.inGameRole === 'redFish' && room.fakeAnswersDistribution) {
                    const fakeAnswer = room.fakeAnswersDistribution.get(player.id);
                    const lieSuggestion = room.players
                        .filter((p: any) => p.inGameRole === 'redFish' && p.id !== player.id)
                        .map((p: any) => room.fakeAnswersDistribution?.get(p.id))
                        .find(a => a !== fakeAnswer) || fakeAnswer;
                    payload.fakeAnswer = fakeAnswer;
                    payload.lieSuggestion = lieSuggestion;
                }

                ws.send(JSON.stringify(payload));
                logger.info({ roomId, deviceId, role: player.inGameRole }, 'Sent role data to reconnecting player');
            }
        },
        async message(ws, message: any) {
            const { roomId } = ws.data.params;
            const { deviceId } = ws.data.query;

            let parsedMessage = message;
            if (typeof message === 'string') {
                try {
                    parsedMessage = JSON.parse(message);
                } catch(e) {
                    logger.warn({ roomId, deviceId, error: e }, 'Invalid WebSocket message format');
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
                        const lieSuggestion = questionData.fakeAnswers.find(a => a !== fakeAnswer) || shuffledFakes[0];
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
                 * End Round (Admin forces end - resets ALL scores and returns to lobby)
                 */
                else if (parsedMessage.type === 'end_round') {
                    logger.info({ roomId, deviceId }, 'Admin ended the round (reset all scores)');

                    room.status = 'lobby';
                    room.players.forEach(p => {
                        p.inGameRole = null;
                    });
                    room.question = null;
                    room.correctAnswer = null;
                    room.eliminatedPlayers = [];
                    room.currentTempPoints = 0;
                    room.scores = new Map(); // Clear all accumulated scores
                    room.gameHistory = []; // Clear game history
                    room.currentRound = 1; // Reset round counter
                    room.lastGuesserId = null; // Reset Guesser tracking
                    await room.save();

                    const updatePayload = JSON.stringify({
                        type: 'room_state_update',
                        room: room.toJSON()
                    });
                    ws.publish(`room:${roomId}`, updatePayload);
                    ws.send(updatePayload);
                }

                /**
                 * Next Round (Start new round with rotated Guesser)
                 */
                else if (parsedMessage.type === 'next_round') {
                    // Validate admin
                    if (!player.isAdmin) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Only admin can start next round'
                        }));
                        return;
                    }

                    logger.info({ roomId, deviceId }, 'Admin started next round');

                    // Check if all players have been Guesser
                    const guesserHistory = room.gameHistory || [];
                    const allBeenGuesser = room.players.every(p => 
                        guesserHistory.some(h => h.guesserId === p.id)
                    );

                    if (allBeenGuesser) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'All players have been Guesser. Game is over.'
                        }));
                        return;
                    }

                    // Reset room for new round
                    room.status = 'playing';
                    room.question = null;
                    room.correctAnswer = null;
                    room.eliminatedPlayers = [];
                    room.currentTempPoints = 0;
                    room.fakeAnswersDistribution = new Map();

                    // Assign new roles (rotates Guesser)
                    const roleAssignment = assignRoles(room.players, room.lastGuesserId);
                    
                    // Update player roles
                    room.players.forEach(p => {
                        const role = roleAssignment.assignments.get(p.id);
                        if (role) {
                            p.inGameRole = role;
                        }
                    });

                    room.lastGuesserId = roleAssignment.guesserId;
                    room.currentRound = (room.currentRound || 1) + 1;

                    // Get new question
                    const questionData = await getRandomQuestion('english', 'medium');
                    if (!questionData) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Failed to get question'
                        }));
                        return;
                    }

                    room.question = questionData.question;
                    room.correctAnswer = questionData.correctAnswer;

                    // Distribute fake answers to Red Fish
                    const fakeAnswersDistribution = new Map<string, string>();
                    const shuffledFakes = [...questionData.fakeAnswers].sort(() => 0.5 - Math.random());
                    roleAssignment.redFishIds.forEach((playerId, index) => {
                        const fakeAnswer = shuffledFakes[index % shuffledFakes.length];
                        fakeAnswersDistribution.set(playerId, fakeAnswer);
                    });
                    room.fakeAnswersDistribution = fakeAnswersDistribution;

                    await room.save();

                    // Build player data map and broadcast (same as start_game)
                    const playerDataMap: Record<string, {
                        role: GameRole;
                        question: string;
                        correctAnswer?: string;
                        fakeAnswer?: string;
                        lieSuggestion?: string;
                    }> = {};

                    playerDataMap[roleAssignment.guesserId] = {
                        role: 'guesser',
                        question: room.question!
                    };

                    playerDataMap[roleAssignment.blueFishId] = {
                        role: 'blueFish',
                        question: room.question!,
                        correctAnswer: room.correctAnswer!
                    };

                    roleAssignment.redFishIds.forEach((playerId, index) => {
                        const fakeAnswer = shuffledFakes[index % shuffledFakes.length];
                        const lieSuggestion = questionData.fakeAnswers.find(a => a !== fakeAnswer) || shuffledFakes[0];
                        playerDataMap[playerId] = {
                            role: 'redFish',
                            question: room.question!,
                            fakeAnswer,
                            lieSuggestion
                        };
                    });

                    const payload = {
                        type: 'round_started',
                        round: room.currentRound,
                        room: room.toJSON(),
                        playerDataMap,
                        // Include points breakdown if round just ended
                        pointsBreakdown: (room as any).getPointsBreakdown()
                    };

                    ws.publish(`room:${roomId}`, JSON.stringify(payload));
                    ws.send(JSON.stringify(payload));

                    logger.info({ 
                        roomId, 
                        round: room.currentRound,
                        guesserId: roleAssignment.guesserId 
                    }, 'New round started');
                }

                /**
                 * End Game (Admin ends game, show final rankings)
                 */
                else if (parsedMessage.type === 'end_game') {
                    // Validate admin
                    if (!player.isAdmin) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Only admin can end game'
                        }));
                        return;
                    }

                    logger.info({ roomId, deviceId }, 'Admin ended game');

                    // Calculate final rankings
                    const scores = room.scores || new Map();
                    const rankings = calculateRankings(room.players, scores);

                    room.status = 'completed';
                    await room.save();

                    const payload = {
                        type: 'game_ended',
                        room: room.toJSON(),
                        rankings
                    };

                    ws.publish(`room:${roomId}`, JSON.stringify(payload));
                    ws.send(JSON.stringify(payload));

                    logger.info({ roomId, rankings }, 'Game ended with rankings');
                }

                /**
                 * Reset Lobby (Admin resets all scores and returns to lobby)
                 */
                else if (parsedMessage.type === 'reset_lobby') {
                    // Validate admin
                    if (!player.isAdmin) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Only admin can reset lobby'
                        }));
                        return;
                    }

                    logger.info({ roomId, deviceId }, 'Admin reset lobby (cleared all scores)');

                    room.status = 'lobby';
                    room.players.forEach(p => {
                        p.inGameRole = null;
                    });
                    room.question = null;
                    room.correctAnswer = null;
                    room.eliminatedPlayers = [];
                    room.currentTempPoints = 0;
                    room.scores = new Map(); // Clear all accumulated scores
                    room.gameHistory = []; // Clear game history
                    room.currentRound = 1; // Reset round counter
                    room.lastGuesserId = null; // Reset Guesser tracking
                    await room.save();

                    const updatePayload = JSON.stringify({
                        type: 'lobby_reset',
                        room: room.toJSON()
                    });
                    ws.publish(`room:${roomId}`, updatePayload);
                    ws.send(updatePayload);
                }

                /**
                 * Room State Update (send current state with points/rankings if applicable)
                 */
                else if (parsedMessage.type === 'get_room_state') {
                    // Send room state with points breakdown or rankings if applicable
                    const roomData = room.toJSON();
                    const responseData: any = {
                        type: 'room_state_update',
                        room: roomData
                    };

                    // Add points breakdown if in round_end state
                    if (room.status === 'round_end') {
                        responseData.pointsBreakdown = (room as any).getPointsBreakdown();
                    }

                    // Add rankings if in completed state
                    if (room.status === 'completed') {
                        responseData.rankings = (room as any).getRankings();
                    }

                    ws.send(JSON.stringify(responseData));
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
             * Room State Update (send current state with points/rankings if applicable)
             * Available to ALL players (not just admin)
             */
            if (parsedMessage.type === 'get_room_state') {
                // Send room state with points breakdown or rankings if applicable
                const roomData = room.toJSON();
                const responseData: any = {
                    type: 'room_state_update',
                    room: roomData
                };

                // Add points breakdown if in round_end state
                if (room.status === 'round_end') {
                    responseData.pointsBreakdown = (room as any).getPointsBreakdown();
                }

                // Add rankings if in completed state
                if (room.status === 'completed') {
                    responseData.rankings = (room as any).getRankings();
                }

                ws.send(JSON.stringify(responseData));
                logger.info({ roomId, deviceId, status: room.status }, 'Sent room state with points/rankings');
            }

            /**
             * Submit Guess (Guesser eliminates a player)
             * This is NOT an admin-only action - any Guesser can submit
             */
            if (parsedMessage.type === 'submit_guess') {
                // Validate sender is current Guesser
                if (player.inGameRole !== 'guesser') {
                    logger.warn({ roomId, deviceId, role: player.inGameRole }, 'Non-guesser tried to submit guess');
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Only Guesser can submit guesses'
                    }));
                    return;
                }

                // Validate game is in guessing phase
                if (room.status !== 'playing') {
                    logger.warn({ roomId, status: room.status }, 'Game not in playing state');
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Game is not in guessing phase'
                    }));
                    return;
                }

                const targetPlayerId = parsedMessage.targetPlayerId;
                const targetPlayer = room.players.find(p => p.id === targetPlayerId);

                if (!targetPlayer) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Player not found'
                    }));
                    return;
                }

                // Check if already eliminated
                if (room.eliminatedPlayers?.includes(targetPlayerId)) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Player already eliminated'
                    }));
                    return;
                }

                logger.info({ roomId, guesserId: player.id, targetPlayerId }, 'Guesser submitted guess');

                // Determine target's role
                const targetRole = targetPlayer.inGameRole;
                const isCorrect = targetRole === 'redFish';

                // Update temp points
                room.currentTempPoints = calculateGuesserScore(isCorrect, room.currentTempPoints || 0);

                // Add to eliminated players
                if (!room.eliminatedPlayers) {
                    room.eliminatedPlayers = [];
                }
                room.eliminatedPlayers.push(targetPlayerId);

                // Calculate remaining Red Fish
                const remainingRedFish = room.players.filter(p =>
                    p.inGameRole === 'redFish' && !room.eliminatedPlayers?.includes(p.id)
                ).length;

                // Determine round winner
                const winner = determineRoundWinner(targetRole as 'blueFish' | 'redFish', remainingRedFish);

                // Initialize scores map if needed
                if (!room.scores) {
                    room.scores = new Map();
                }

                // Initialize score entries for all players if not exists
                room.players.forEach(player => {
                    if (!room.scores!.has(player.id)) {
                        room.scores!.set(player.id, {
                            totalPoints: 0,
                            tempPoints: 0,
                            roundsAsGuesser: 0,
                            roundsAsBlueFish: 0,
                            roundsAsRedFish: 0
                        });
                    }
                });

                if (winner === 'guesser' || winner === 'redFish') {
                    // Round ended - award points
                    const guesserId = room.players.find(p => p.inGameRole === 'guesser')?.id;
                    const blueFishId = room.players.find(p => p.inGameRole === 'blueFish')?.id;
                    const redFishIds = room.players.filter(p => p.inGameRole === 'redFish').map(p => p.id);

                    if (guesserId && blueFishId) {
                        // Pass eliminatedRedFishIds so only surviving Red Fish get points
                        awardRoundPoints(
                            room.scores,
                            guesserId,
                            blueFishId,
                            redFishIds,
                            winner,
                            room.currentTempPoints || 0,
                            room.eliminatedPlayers?.filter(id => redFishIds.includes(id)) // Only Red Fish who were eliminated
                        );

                        // Update role counts
                        updateRoleCounts(room.scores, guesserId, blueFishId, redFishIds);
                    }

                    // Transition to round_end
                    room.status = 'round_end';

                    logger.info({ roomId, winner, tempPoints: room.currentTempPoints }, 'Round ended');
                } else {
                    // Game continues - more Red Fish to eliminate
                    logger.info({ roomId, tempPoints: room.currentTempPoints, remainingRedFish }, 'Guess correct, game continues');
                }

                await room.save();

                // Build enhanced elimination result payload
                let eliminationPayload: any = {
                    type: 'guess_submitted',
                    targetPlayerId,
                    targetPlayerName: targetPlayer.name,
                    eliminatedPlayerRole: targetPlayer.inGameRole,
                    eliminatedPlayerName: targetPlayer.name,
                    isCorrect,
                    isRoundOver: room.status === 'round_end',
                    pointsAwarded: room.status === 'round_end' ? room.currentTempPoints : 0,
                    tempPoints: room.currentTempPoints,
                    eliminatedPlayers: room.eliminatedPlayers,
                    room: room.toJSON()
                };

                // Add points breakdown if round ended
                if (room.status === 'round_end' && (winner === 'guesser' || winner === 'redFish')) {
                    const scores = room.scores || new Map();
                    // Filter to get only eliminated Red Fish
                    const eliminatedRedFishIds = room.eliminatedPlayers?.filter(id => 
                        room.players.find(p => p.id === id)?.inGameRole === 'redFish'
                    );
                    eliminationPayload.pointsBreakdown = generatePointsBreakdown(
                        room.players,
                        scores,
                        winner,
                        room.currentTempPoints || 0,
                        eliminatedRedFishIds
                    );
                }

                ws.publish(`room:${roomId}`, JSON.stringify(eliminationPayload));
                ws.send(JSON.stringify(eliminationPayload));

                logger.info({
                    roomId,
                    eliminatedPlayerId: targetPlayerId,
                    eliminatedPlayerRole: targetPlayer.inGameRole,
                    isCorrect,
                    isRoundOver: room.status === 'round_end',
                    tempPoints: room.currentTempPoints
                }, 'Guess submitted with elimination result');
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

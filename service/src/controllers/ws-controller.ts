import { Elysia, t } from 'elysia';
import GameRoom, { IPlayer } from '../models/game-room';
import { roomService, type LeaveRoomResult } from '../services/room-service';
import { gameService } from '../services/game-service';
import { logger } from '../lib/logger';

/**
 * WebSocket message types
 */
interface WSMessage {
  type: string;
  data: any;
}

interface JoinRoomData {
  roomCode: string;
  deviceId: string;
}

interface LeaveRoomData {
  roomCode: string;
  deviceId: string;
}

interface StartGameData {
  roomCode: string;
}

interface GenerateLieData {
  roomCode: string;
  deviceId: string;
}

/**
 * Map to track player WebSocket connections by room
 */
const roomConnections = new Map<string, Set<any>>();

/**
 * Map to track which players have been announced in each room
 */
const announcedPlayers = new Map<string, Set<string>>(); // roomCode -> Set of deviceIds

/**
 * Handle WebSocket messages
 */
async function handleMessage(ws: any, message: WSMessage) {
  const { type, data } = message;

  try {
    switch (type) {
      case 'join_room':
        await handleJoinRoom(ws, data as JoinRoomData);
        break;

      case 'leave_room':
        await handleLeaveRoom(ws, data as LeaveRoomData);
        break;

      case 'start_game':
        await handleStartGame(ws, data as StartGameData);
        break;

      case 'generate_lie':
        await handleGenerateLie(ws, data as GenerateLieData);
        break;

      default:
        logger.warn({ type }, 'Unknown WS message type');
        ws.send({ type: 'error', data: { code: 'UNKNOWN_MESSAGE', message: 'Unknown message type' } });
    }
  } catch (error) {
    logger.error({ type, error: error instanceof Error ? error.message : 'Unknown error' }, 'WS error handling message');
    ws.send({
      type: 'error',
      data: {
        code: 'WS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to process message'
      }
    });
  }
}

/**
 * Handle join_room event
 */
async function handleJoinRoom(ws: any, data: JoinRoomData) {
  const { roomCode, deviceId } = data;
  const normalizedRoomCode = roomCode.toUpperCase();

  const room = await GameRoom.findOne({ roomCode: normalizedRoomCode });

  if (!room) {
    ws.send({ type: 'error', data: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } });
    return;
  }

  // Store device ID and room code in websocket data
  ws.data = { ...ws.data, deviceId, roomCode: normalizedRoomCode };

  // Subscribe to room channel for pub/sub
  ws.subscribe(normalizedRoomCode);

  // Track connection
  if (!roomConnections.has(normalizedRoomCode)) {
    roomConnections.set(normalizedRoomCode, new Set());
  }
  roomConnections.get(normalizedRoomCode)!.add(ws);

  // Get the player from the room
  const player = room.players.find(p => p.deviceId === deviceId);

  if (player) {
    // Check if player has already been announced
    const hasBeenAnnounced = announcedPlayers.get(normalizedRoomCode)?.has(deviceId) || false;

    // Broadcast player_joined ONLY if not already announced
    if (!hasBeenAnnounced) {
      ws.publish(normalizedRoomCode, {
        type: 'player_joined',
        data: {
          deviceId: player.deviceId,
          playerName: player.name,
          playerCount: room.players.length
        }
      });

      // Track that this player has been announced
      if (!announcedPlayers.has(normalizedRoomCode)) {
        announcedPlayers.set(normalizedRoomCode, new Set());
      }
      announcedPlayers.get(normalizedRoomCode)!.add(deviceId);
    }

    // Broadcast room_updated to ALL players in the room (critical for host's player list to update)
    ws.publish(normalizedRoomCode, {
      type: 'room_updated',
      data: room
    });

    // CRITICAL FIX: If room is already in briefing status, send start_round to late-joiner (only once)
    if (room.status === 'briefing' && player.inGameRole) {
      // Check if player has already received start_round (track in session)
      const hasReceivedStartRound = ws.data?.hasReceivedStartRound;
      
      if (!hasReceivedStartRound) {
        logger.info({ roomCode: normalizedRoomCode, deviceId, role: player.inGameRole }, 'Late joiner detected - sending start_round');

        const payload = gameService.getRoleSpecificPayload(player, room);
        ws.send({
          type: 'start_round',
          data: payload
        });

        // Mark that this player has received start_round
        ws.data = { ...ws.data, hasReceivedStartRound: true };
        
        logger.info({ deviceId, role: player.inGameRole }, 'Sent start_round to late joiner');
      } else {
        logger.debug({ deviceId }, 'Player already received start_round, skipping');
      }
    } else if (room.status === 'briefing' && !player.inGameRole) {
      // Player doesn't have a role yet - this shouldn't happen, but log it
      logger.warn({ roomCode: normalizedRoomCode, deviceId, role: player.inGameRole }, 'Late joiner without role - room status is briefing');
    }
  } else {
    // Player not found in room - send error
    ws.send({ type: 'error', data: { code: 'PLAYER_NOT_FOUND', message: 'Player not found in room' } });
  }
}

/**
 * Handle leave_room event
 */
async function handleLeaveRoom(ws: any, data: LeaveRoomData) {
  const { roomCode, deviceId } = data;
  const normalizedRoomCode = roomCode.toUpperCase();

  // Step 1: Get room state BEFORE removing player
  const roomBeforeLeave = await GameRoom.findOne({ roomCode: normalizedRoomCode });

  if (!roomBeforeLeave) {
    ws.send({ type: 'error', data: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } });
    return;
  }

  const leavingPlayer = roomBeforeLeave.players.find(p => p.deviceId === deviceId);
  const isHostLeaving = deviceId === roomBeforeLeave.hostId;

  // Step 2: Remove player from database (handles host transfer and room deletion)
  const result: LeaveRoomResult = await roomService.leaveRoom(normalizedRoomCode, deviceId);

  // Step 3: Handle based on result
  if (result.roomDeleted) {
    // Room was deleted - notify leaving player
    ws.send({
      type: 'room_deleted',
      data: {
        roomCode: normalizedRoomCode,
        reason: isHostLeaving ? 'Host left and room was empty' : 'Last player left'
      }
    });

    // Unsubscribe and clean up
    ws.unsubscribe(normalizedRoomCode);
    const connections = roomConnections.get(normalizedRoomCode);
    if (connections) {
      connections.delete(ws);
    }
    // Clean up announced players map
    announcedPlayers.delete(normalizedRoomCode);
    return;
  }

  // Step 4: Broadcast to remaining players
  const roomAfterLeave = await GameRoom.findOne({ roomCode: normalizedRoomCode });

  if (!roomAfterLeave) {
    ws.send({ type: 'error', data: { code: 'ROOM_NOT_FOUND', message: 'Room not found after leave' } });
    ws.unsubscribe(normalizedRoomCode);
    const connections = roomConnections.get(normalizedRoomCode);
    if (connections) {
      connections.delete(ws);
    }
    return;
  }

  // If host transferred, broadcast host_transferred event
  if (result.newHostId) {
    const newHost = roomAfterLeave.players.find(p => p.deviceId === result.newHostId);
    ws.publish(normalizedRoomCode, {
      type: 'host_transferred',
      data: {
        newHostId: result.newHostId,
        newHostName: newHost?.name || 'Player'
      }
    });
  }

  // Broadcast player_left to all remaining players
  ws.publish(normalizedRoomCode, {
    type: 'player_left',
    data: {
      deviceId,
      playerName: leavingPlayer?.name || 'Player',
      remainingCount: roomAfterLeave.players.length,
      newHostId: result.newHostId || undefined
    }
  });

  // Broadcast room_updated to all remaining players
  ws.publish(normalizedRoomCode, {
    type: 'room_updated',
    data: roomAfterLeave
  });

  // Send confirmation to leaving player
  ws.send({
    type: 'left_room',
    data: {
      roomCode: normalizedRoomCode,
      deviceId
    }
  });

  // Unsubscribe and clean up (after broadcasting)
  ws.unsubscribe(normalizedRoomCode);
  const connections = roomConnections.get(normalizedRoomCode);
  if (connections) {
    connections.delete(ws);
  }
  // Remove from announced players
  const announced = announcedPlayers.get(normalizedRoomCode);
  if (announced) {
    announced.delete(deviceId);
    if (announced.size === 0) {
      announcedPlayers.delete(normalizedRoomCode);
    }
  }
}

/**
 * Handle start_game event
 */
async function handleStartGame(ws: any, data: StartGameData) {
  const { roomCode } = data;
  const normalizedRoomCode = roomCode.toUpperCase();

  try {
    // Start briefing phase (generates AI data, assigns roles)
    const { room } = await gameService.startBriefing(normalizedRoomCode);

    // Broadcast game started
    ws.publish(normalizedRoomCode, {
      type: 'game_started',
      data: {
        roomCode: normalizedRoomCode,
        status: room.status
      }
    });

    // Send role-specific payloads to ALL players in the room via broadcast
    // Each player will receive their own role-specific data
    const connections = roomConnections.get(normalizedRoomCode);
    if (connections) {
      for (const connection of connections) {
        const deviceId = connection.data?.deviceId;
        const player = room.players.find(p => p.deviceId === deviceId);

        if (player) {
          const payload = gameService.getRoleSpecificPayload(player, room);
          // Send directly to this specific connection
          connection.send({
            type: 'start_round',
            data: payload
          });
        }
      }
    }
    
    // Also broadcast to ensure all players receive it (fallback)
    ws.publish(normalizedRoomCode, {
      type: 'start_round_broadcast',
      data: { message: 'Game started, check your role' }
    });

    logger.info({ roomCode: normalizedRoomCode }, 'Game started');
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Error in start_game');
    ws.send({
      type: 'error',
      data: {
        code: 'START_ERROR',
        message: error instanceof Error ? error.message : 'Failed to start game'
      }
    });
  }
}

/**
 * Handle generate_lie event (for Red Herring players)
 */
async function handleGenerateLie(ws: any, data: GenerateLieData) {
  const { roomCode, deviceId } = data;
  const normalizedRoomCode = roomCode.toUpperCase();

  try {
    const result = await gameService.generateLieForPlayer(normalizedRoomCode, deviceId);

    // Send lie suggestion to the requesting player
    ws.send({
      type: 'lie_generated',
      data: {
        lieSuggestion: result.lieSuggestion,
        usedFallback: result.usedFallback
      }
    });

    logger.info({ playerId: deviceId, roomCode: normalizedRoomCode }, 'Lie generated');
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Error in generate_lie');
    ws.send({
      type: 'error',
      data: {
        code: 'LIE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate lie'
      }
    });
  }
}

/**
 * WebSocket controller for real-time game communication
 * Pattern from Outsider project: Query parameter authentication
 */
export const wsController = new Elysia()
  .ws('/ws', {
    // Query parameter validation (from Outsider pattern)
    query: t.Object({
      roomCode: t.String(),
      deviceId: t.Optional(t.String()),
    }),

    body: t.Object({
      type: t.String(),
      data: t.Any(),
    }),

    open(ws) {
      const { roomCode, deviceId } = ws.data.query;
      const normalizedRoomCode = roomCode.toUpperCase();

      logger.info({ roomCode: normalizedRoomCode, deviceId }, '✅ WS connected');

      // Subscribe to room channel for pub/sub (use normalized room code without prefix)
      ws.subscribe(normalizedRoomCode);

      // Mark player as online and broadcast reconnection
      if (deviceId) {
        // Mark player as online in database
        GameRoom.findOne({ roomCode: normalizedRoomCode })
          .then(async (room) => {
            if (!room) return;

            const player = room.players.find(p => p.deviceId === deviceId);
            if (player) {
              // Always mark player as online
              player.isOnline = true;
              player.lastSeen = new Date();
              await room.save();

              // Broadcast player_reconnected to all players (including self)
              ws.publish(normalizedRoomCode, JSON.stringify({
                type: 'player_reconnected',
                data: {
                  deviceId,
                  playerName: player.name,
                  isOnline: true
                }
              }));

              // Broadcast updated room state to all players
              ws.publish(normalizedRoomCode, JSON.stringify({
                type: 'room_updated',
                data: room
              }));
            }
          })
          .catch((err) => {
            logger.error({ error: err instanceof Error ? err.message : 'Unknown error' }, 'Error marking player as online');
          });
      }

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        data: { roomCode: normalizedRoomCode, deviceId }
      }));
    },
    close(ws) {
      const { roomCode, deviceId } = ws.data.query;
      const normalizedRoomCode = roomCode.toUpperCase();

      logger.info({ roomCode: normalizedRoomCode, deviceId }, '❌ WS disconnected');

      // Handle disconnection - mark as offline, DON'T remove from room
      if (deviceId && normalizedRoomCode) {
        // Remove from connections tracking
        const connections = roomConnections.get(normalizedRoomCode);
        if (connections) {
          connections.delete(ws);
        }

        // Get room state before marking disconnected
        GameRoom.findOne({ roomCode: normalizedRoomCode })
          .then(async (roomBeforeLeave) => {
            if (!roomBeforeLeave) return;

            // CRITICAL BUG FIX: Pass isDisconnect=true to prevent room deletion
            // Mark player as disconnected (not removed from room)
            const result = await roomService.leaveRoom(normalizedRoomCode, deviceId, true); // true = isDisconnect

            // Handle room deletion case
            if (result.roomDeleted) {
              logger.info({ roomCode: normalizedRoomCode }, 'Room deleted due to host disconnection');
              return;
            }

            // Get updated room state
            const roomAfterLeave = await GameRoom.findOne({ roomCode: normalizedRoomCode });

            if (!roomAfterLeave) return;

            // Broadcast player_disconnected (not player_left)
            ws.publish(normalizedRoomCode, JSON.stringify({
              type: 'player_disconnected',
              data: {
                deviceId,
                playerName: roomBeforeLeave.players.find(p => p.deviceId === deviceId)?.name || 'Player',
                isOnline: false,
                lastSeen: new Date().toISOString()
              }
            }));

            // Broadcast room_updated to remaining players
            ws.publish(normalizedRoomCode, JSON.stringify({
              type: 'room_updated',
              data: roomAfterLeave
            }));
          })
          .catch((err) => {
            logger.error({ error: err instanceof Error ? err.message : 'Unknown error' }, 'Error handling player disconnect');
          });
      }

      // Unsubscribe after broadcasting (player still in room, just offline)
      ws.unsubscribe(normalizedRoomCode);
    },
    message(ws, message: WSMessage) {
      handleMessage(ws, message);
    },
  });

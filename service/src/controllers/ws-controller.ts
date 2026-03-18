import { Elysia, t } from 'elysia';
import GameRoom, { IGameRoom, IPlayer } from '../models/game-room';
import { roomService, type LeaveRoomResult } from '../services/room-service';
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
  playerId: string;
}

interface LeaveRoomData {
  roomCode: string;
  playerId: string;
}

interface ReadyUpData {
  roomCode: string;
  playerId: string;
}

interface StartGameData {
  roomCode: string;
}

interface RoomConnections {
  [roomCode: string]: Set<any>;
}

/**
 * Map to track player WebSocket connections by room
 */
const roomConnections = new Map<string, Set<any>>();

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

      case 'ready_up':
        await handleReadyUp(ws, data as ReadyUpData);
        break;

      case 'start_game':
        await handleStartGame(ws, data as StartGameData);
        break;

      default:
        logger.warn(`Unknown WS message type: ${type}`);
        ws.send({ type: 'error', data: { code: 'UNKNOWN_MESSAGE', message: 'Unknown message type' } });
    }
  } catch (error) {
    logger.error(`WS error handling ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  const { roomCode, playerId } = data;
  const normalizedRoomCode = roomCode.toUpperCase();

  const room = await GameRoom.findOne({ roomCode: normalizedRoomCode });

  if (!room) {
    ws.send({ type: 'error', data: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } });
    return;
  }

  // Store player ID and room code in websocket data
  ws.data = { ...ws.data, playerId, roomCode: normalizedRoomCode };

  // Subscribe to room channel for pub/sub
  ws.subscribe(normalizedRoomCode);

  // Track connection
  if (!roomConnections.has(normalizedRoomCode)) {
    roomConnections.set(normalizedRoomCode, new Set());
  }
  roomConnections.get(normalizedRoomCode)!.add(ws);

  // Get the player from the room
  const player = room.players.find(p => p.playerId === playerId);
  
  if (player) {
    // Broadcast player_joined to ALL players in the room (including the joining player)
    ws.publish(normalizedRoomCode, {
      type: 'player_joined',
      data: {
        playerId: player.playerId,
        playerName: player.name,
        playerCount: room.players.length
      }
    });

    // Broadcast room_updated to ALL players in the room (critical for host's player list to update)
    ws.publish(normalizedRoomCode, {
      type: 'room_updated',
      data: room
    });
  } else {
    // Player not found in room - send error
    ws.send({ type: 'error', data: { code: 'PLAYER_NOT_FOUND', message: 'Player not found in room' } });
  }
}

/**
 * Handle leave_room event
 * 
 * Flow:
 * 1. Get room BEFORE removing player (to know who's leaving)
 * 2. Call roomService.leaveRoom()
 * 3. Check result:
 *    - If roomDeleted: Send 'room_deleted' to leaving player
 *    - If newHostId: Broadcast 'host_transferred' to remaining players
 * 4. Broadcast 'player_left' and 'room_updated' to remaining players
 */
async function handleLeaveRoom(ws: any, data: LeaveRoomData) {
  const { roomCode, playerId } = data;
  const normalizedRoomCode = roomCode.toUpperCase();

  // Step 1: Get room state BEFORE removing player
  const roomBeforeLeave = await GameRoom.findOne({ roomCode: normalizedRoomCode });

  if (!roomBeforeLeave) {
    ws.send({ type: 'error', data: { code: 'ROOM_NOT_FOUND', message: 'Room not found' } });
    return;
  }

  const leavingPlayer = roomBeforeLeave.players.find(p => p.playerId === playerId);
  const isHostLeaving = playerId === roomBeforeLeave.hostId;

  // Step 2: Remove player from database (handles host transfer and room deletion)
  const result: LeaveRoomResult = await roomService.leaveRoom(normalizedRoomCode, playerId);

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
    return;
  }

  // Step 4: Broadcast to remaining players
  const roomAfterLeave = await GameRoom.findOne({ roomCode: normalizedRoomCode });

  if (!roomAfterLeave) {
    // Edge case: room was deleted between operations
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
    const newHost = roomAfterLeave.players.find(p => p.playerId === result.newHostId);
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
      playerId,
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
      playerId
    }
  });

  // Unsubscribe and clean up (after broadcasting)
  ws.unsubscribe(normalizedRoomCode);
  const connections = roomConnections.get(normalizedRoomCode);
  if (connections) {
    connections.delete(ws);
  }
}

/**
 * Handle ready_up event
 */
async function handleReadyUp(ws: any, data: ReadyUpData) {
  const { roomCode, playerId } = data;
  const normalizedRoomCode = roomCode.toUpperCase();

  const allReady = await roomService.toggleReady(normalizedRoomCode, playerId);

  // Broadcast updated room state
  const room = await GameRoom.findOne({ roomCode: normalizedRoomCode });
  if (room) {
    ws.publish(normalizedRoomCode, { type: 'room_updated', data: room });

    // If all players ready, notify
    if (allReady) {
      ws.publish(normalizedRoomCode, { type: 'all_players_ready', data: { roomCode: normalizedRoomCode } });
    }
  }
}

/**
 * Handle start_game event
 */
async function handleStartGame(ws: any, data: StartGameData) {
  const { roomCode } = data;
  const normalizedRoomCode = roomCode.toUpperCase();

  const room = await roomService.startGame(normalizedRoomCode);

  // Broadcast game started
  ws.publish(normalizedRoomCode, {
    type: 'game_started',
    data: {
      roomCode: normalizedRoomCode,
      status: room.status
    }
  });

  // Send role-specific payloads to all players in the room
  const connections = roomConnections.get(normalizedRoomCode);
  if (connections) {
    for (const connection of connections) {
      const playerId = connection.data?.playerId;
      const player = room.players.find(p => p.playerId === playerId);

      if (player) {
        connection.send({
          type: 'start_round',
          data: {
            question: room.question || 'Question not generated',
            secretWord: player.role === 'bigFish' ? room.secretWord : undefined,
            canGenerateLie: player.role === 'redHerring',
            role: player.role
          }
        });
      }
    }
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
      playerId: t.Optional(t.String()),
    }),
    
    body: t.Object({
      type: t.String(),
      data: t.Any(),
    }),
    
    open(ws) {
      const { roomCode, playerId } = ws.data.query;
      const normalizedRoomCode = roomCode.toUpperCase();

      logger.info(`✅ WS connected: room=${normalizedRoomCode}, player=${playerId || 'anonymous'}`);

      // Subscribe to room channel for pub/sub (use normalized room code without prefix)
      ws.subscribe(normalizedRoomCode);

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        data: { roomCode: normalizedRoomCode, playerId }
      }));
    },
    close(ws) {
      const { roomCode, playerId } = ws.data.query;
      const normalizedRoomCode = roomCode.toUpperCase();

      logger.info(`❌ WS disconnected: room=${normalizedRoomCode}, player=${playerId || 'anonymous'}`);

      // Handle disconnection - remove from room
      if (playerId && normalizedRoomCode) {
        // Remove from connections tracking
        const connections = roomConnections.get(normalizedRoomCode);
        if (connections) {
          connections.delete(ws);
        }

        // Get room state before removal
        GameRoom.findOne({ roomCode: normalizedRoomCode })
          .then(async (roomBeforeLeave) => {
            if (!roomBeforeLeave) return;

            const isHostLeaving = playerId === roomBeforeLeave.hostId;

            // Update room in database (handles host transfer and room deletion)
            const result = await roomService.leaveRoom(normalizedRoomCode, playerId);

            // Handle room deletion case
            if (result.roomDeleted) {
              logger.info(`Room ${normalizedRoomCode} deleted due to host disconnection`);
              return;
            }

            // Get updated room state
            const roomAfterLeave = await GameRoom.findOne({ roomCode: normalizedRoomCode });

            if (!roomAfterLeave) return;

            // If host transferred, broadcast host_transferred
            if (result.newHostId) {
              const newHost = roomAfterLeave.players.find(p => p.playerId === result.newHostId);
              ws.publish(normalizedRoomCode, JSON.stringify({
                type: 'host_transferred',
                data: {
                  newHostId: result.newHostId,
                  newHostName: newHost?.name || 'Player'
                }
              }));
            }

            // Broadcast player_left to remaining players
            ws.publish(normalizedRoomCode, JSON.stringify({
              type: 'player_left',
              data: {
                playerId,
                playerName: roomBeforeLeave.players.find(p => p.playerId === playerId)?.name || 'Player',
                remainingCount: roomAfterLeave.players.length,
                newHostId: result.newHostId || undefined
              }
            }));

            // Broadcast room_updated to remaining players
            ws.publish(normalizedRoomCode, JSON.stringify({
              type: 'room_updated',
              data: roomAfterLeave
            }));
          })
          .catch((err) => {
            logger.error(`Error handling player disconnect: ${err instanceof Error ? err.message : 'Unknown error'}`);
          });
      }
    },
    message(ws, message: WSMessage) {
      handleMessage(ws, message);
    },
  });

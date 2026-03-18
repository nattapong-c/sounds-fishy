import { Elysia, t } from 'elysia';
import GameRoom, { IGameRoom, IPlayer } from '../models/game-room';
import { RoomService } from '../services/room-service';
import { logger } from '../lib/logger';

const roomService = new RoomService();

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

  // Broadcast player joined
  const player = room.players.find(p => p.playerId === playerId);
  if (player) {
    ws.publish(normalizedRoomCode, {
      type: 'player_joined',
      data: {
        playerId: player.playerId,
        playerName: player.name,
        playerCount: room.players.length
      }
    });
  }

  // Send current room state to the player
  ws.send({ type: 'room_updated', data: room });
}

/**
 * Handle leave_room event
 */
async function handleLeaveRoom(ws: any, data: LeaveRoomData) {
  const { roomCode, playerId } = data;
  const normalizedRoomCode = roomCode.toUpperCase();

  // Unsubscribe from room channel
  ws.unsubscribe(normalizedRoomCode);

  // Remove from connections
  const connections = roomConnections.get(normalizedRoomCode);
  if (connections) {
    connections.delete(ws);
  }

  // Remove player from database
  await roomService.leaveRoom(normalizedRoomCode, playerId);

  // Broadcast player left
  const room = await GameRoom.findOne({ roomCode: normalizedRoomCode });
  if (room) {
    ws.publish(normalizedRoomCode, {
      type: 'player_left',
      data: {
        playerId,
        playerName: 'Player',
        remainingCount: room.players.length
      }
    });

    ws.publish(normalizedRoomCode, { type: 'room_updated', data: room });
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
 */
export const wsController = new Elysia()
  .ws('/ws', {
    body: t.Object({
      type: t.String(),
      data: t.Any(),
    }),
    open(ws) {
      logger.info(`✅ WS connected: ${ws.data?.id || ws.id}`);
    },
    close(ws) {
      logger.info(`❌ WS disconnected: ${ws.data?.id || ws.id}`);
      // Handle disconnection - remove from all rooms
      const playerId = ws.data?.playerId;
      const roomCode = ws.data?.roomCode;

      if (playerId && roomCode) {
        // Remove from connections
        const connections = roomConnections.get(roomCode);
        if (connections) {
          connections.delete(ws);
        }

        // Update room in database
        roomService.leaveRoom(roomCode, playerId).catch((err) => {
          logger.error(`Error removing player on disconnect: ${err instanceof Error ? err.message : 'Unknown error'}`);
        });

        // Broadcast to remaining players
        const remainingCount = connections?.size || 0;
        ws.publish(roomCode, {
          type: 'player_left',
          data: {
            playerId,
            playerName: 'Player',
            remainingCount
          }
        });
      }
    },
    message(ws, message: WSMessage) {
      handleMessage(ws, message);
    },
  });

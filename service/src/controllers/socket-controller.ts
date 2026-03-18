import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import GameRoom from '../models/game-room';
import { RoomService } from '../services/room-service';
import { logger } from '../lib/logger';

const roomService = new RoomService();

export function setupSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`✅ Socket connected: ${socket.id}`);

    // Join a room
    socket.on('join_room', async (data) => {
      try {
        const { roomCode, playerId } = data;
        const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });

        if (!room) {
          socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
          return;
        }

        // Join Socket.IO room
        await socket.join(roomCode.toUpperCase());

        // Broadcast player joined
        const player = room.players.find(p => p.playerId === playerId);
        if (player) {
          socket.to(roomCode.toUpperCase()).emit('player_joined', {
            playerId: player.playerId,
            playerName: player.name,
            playerCount: room.players.length
          });
        }

        // Send current room state to the player
        socket.emit('room_updated', room);
      } catch (error) {
        socket.emit('error', {
          code: 'JOIN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to join room'
        });
      }
    });

    // Leave a room
    socket.on('leave_room', async (data) => {
      try {
        const { roomCode, playerId } = data;

        // Leave Socket.IO room
        await socket.leave(roomCode.toUpperCase());

        // Remove player from database
        await roomService.leaveRoom(roomCode, playerId);

        // Broadcast player left
        const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
        if (room) {
          socket.to(roomCode.toUpperCase()).emit('player_left', {
            playerId,
            playerName: 'Player',
            remainingCount: room.players.length
          });

          socket.to(roomCode.toUpperCase()).emit('room_updated', room);
        }
      } catch (error) {
        socket.emit('error', {
          code: 'LEAVE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to leave room'
        });
      }
    });

    // Toggle ready status
    socket.on('ready_up', async (data) => {
      try {
        const { roomCode, playerId } = data;

        const allReady = await roomService.toggleReady(roomCode, playerId);

        // Broadcast updated room state
        const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
        if (room) {
          io.to(roomCode.toUpperCase()).emit('room_updated', room);

          // If all players ready, notify host
          if (allReady) {
            io.to(roomCode.toUpperCase()).emit('all_players_ready', { roomCode });
          }
        }
      } catch (error) {
        socket.emit('error', {
          code: 'READY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to toggle ready'
        });
      }
    });

    // Start game
    socket.on('start_game', async (data) => {
      try {
        const { roomCode } = data;

        const room = await roomService.startGame(roomCode);

        // Broadcast game started
        io.to(roomCode.toUpperCase()).emit('game_started', {
          roomCode,
          status: room.status
        });

        // Send role-specific payloads
        for (const player of room.players) {
          const playerSocket = io.sockets.sockets.get(
            Array.from(io.sockets.sockets.values()).find(
              s => s.rooms.has(roomCode.toUpperCase())
            )?.id || ''
          );

          if (playerSocket) {
            playerSocket.emit('start_round', {
              question: room.question || 'Question not generated',
              secretWord: player.role === 'bigFish' ? room.secretWord : undefined,
              canGenerateLie: player.role === 'redHerring'
            });
          }
        }
      } catch (error) {
        socket.emit('error', {
          code: 'START_ERROR',
          message: error instanceof Error ? error.message : 'Failed to start game'
        });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      logger.info(`❌ Socket disconnected: ${socket.id}`);

      // Find and remove player from all rooms
      try {
        const rooms = await socket.rooms;
        for (const roomCode of rooms) {
          if (roomCode !== socket.id) { // Skip default room
            await roomService.leaveRoom(roomCode, socket.id);
            socket.to(roomCode).emit('room_updated', {
              message: 'Player left'
            });
          }
        }
      } catch (error) {
        logger.error(`Error handling disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  });

  logger.info('✅ Socket.IO setup complete');

  return io;
}

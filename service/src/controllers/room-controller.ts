import { Elysia, t } from 'elysia';
import { roomService } from '../services/room-service';
import GameRoom from '../models/game-room';
import { NotFoundError, BadRequestError, CustomAppError } from '../lib/errors';
import { logger } from '../lib/logger';

/**
 * Room Controller - REST API endpoints for room management
 */
export const roomController = new Elysia({ prefix: '/api' })
  
  // POST /api/rooms - Create a new room
  .post('/rooms',
    async ({ body, set }) => {
      try {
        const { hostName, deviceId } = body;

        if (!hostName || hostName.trim().length === 0) {
          set.status = 400;
          return { success: false, error: 'Host name is required' };
        }

        if (!deviceId) {
          set.status = 400;
          return { success: false, error: 'Device ID is required' };
        }

        const room = await roomService.createRoom(hostName.trim(), deviceId);

        logger.info({ roomCode: room.roomCode, deviceId }, 'Room created');

        return {
          success: true,
          data: {
            roomId: room._id.toString(),
            roomCode: room.roomCode,
            deviceId: room.hostId
          }
        };
      } catch (error) {
        logger.error(error, 'Failed to create room');
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create room'
        };
      }
    },
    {
      body: t.Object({
        hostName: t.String(),
        deviceId: t.String()
      })
    }
  )

  // GET /api/rooms/:roomCode - Get room details
  .get('/rooms/:roomCode',
    async ({ params, set }) => {
      try {
        const { roomCode } = params;
        const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });

        if (!room) {
          set.status = 404;
          return { success: false, error: 'Room not found' };
        }

        return {
          success: true,
          data: room
        };
      } catch (error) {
        logger.error(error, 'Failed to get room');
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get room'
        };
      }
    }
  )

  // POST /api/rooms/:roomCode/join - Join a room
  .post('/rooms/:roomCode/join',
    async ({ params, body, set }) => {
      try {
        const { roomCode } = params;
        const { playerName, deviceId } = body;

        if (!playerName || playerName.trim().length === 0) {
          set.status = 400;
          return { success: false, error: 'Player name is required' };
        }

        if (!deviceId) {
          set.status = 400;
          return { success: false, error: 'Device ID is required' };
        }

        const player = await roomService.joinRoom(roomCode, playerName.trim(), deviceId);

        logger.info({ roomCode: roomCode.toUpperCase(), deviceId }, 'Player joined');

        return {
          success: true,
          data: {
            deviceId: player.deviceId,
            roomCode: roomCode.toUpperCase(),
            rejoined: true // Player already exists in room
          }
        };
      } catch (error) {
        if (error instanceof CustomAppError) {
          set.status = error.statusCode;
          return { success: false, error: error.message };
        }
        logger.error(error, 'Failed to join room');
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to join room'
        };
      }
    },
    {
      body: t.Object({
        playerName: t.String(),
        deviceId: t.String()
      })
    }
  )

  // POST /api/rooms/:roomCode/leave - Leave a room
  .post('/rooms/:roomCode/leave',
    async ({ params, body, set }) => {
      try {
        const { roomCode } = params;
        const { deviceId } = body;

        if (!deviceId) {
          set.status = 400;
          return { success: false, error: 'Device ID is required' };
        }

        const result = await roomService.leaveRoom(roomCode, deviceId);

        logger.info(
          { roomCode: roomCode.toUpperCase(), deviceId, roomDeleted: result.roomDeleted },
          'Player left room'
        );

        return {
          success: true,
          data: result
        };
      } catch (error) {
        logger.error(error, 'Failed to leave room');
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to leave room'
        };
      }
    },
    {
      body: t.Object({
        deviceId: t.String()
      })
    }
  )

  // POST /api/rooms/:roomCode/ready - Toggle ready status
  .post('/rooms/:roomCode/ready',
    async ({ params, body, set }) => {
      try {
        const { roomCode } = params;
        const { deviceId } = body;

        if (!deviceId) {
          set.status = 400;
          return { success: false, error: 'Device ID is required' };
        }

        const allReady = await roomService.toggleReady(roomCode, deviceId);

        return {
          success: true,
          data: { allReady }
        };
      } catch (error) {
        if (error instanceof CustomAppError) {
          set.status = error.statusCode;
          return { success: false, error: error.message };
        }
        logger.error(error, 'Failed to toggle ready');
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to toggle ready'
        };
      }
    },
    {
      body: t.Object({
        deviceId: t.String()
      })
    }
  )

  // POST /api/rooms/:roomCode/start - Start game (host only)
  .post('/rooms/:roomCode/start',
    async ({ params, set }) => {
      try {
        const { roomCode } = params;

        const room = await roomService.startGame(roomCode);

        logger.info({ roomCode: room.roomCode }, 'Game started');

        return {
          success: true,
          data: {
            roomCode: room.roomCode,
            status: room.status
          }
        };
      } catch (error) {
        if (error instanceof CustomAppError) {
          set.status = error.statusCode;
          return { success: false, error: error.message };
        }
        logger.error(error, 'Failed to start game');
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start game'
        };
      }
    }
  );

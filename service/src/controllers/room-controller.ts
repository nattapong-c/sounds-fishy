import { Elysia, t } from 'elysia';
import { RoomService } from '../services/room-service';
import GameRoom from '../models/game-room';
import { CustomAppError } from '../lib/errors';

const roomService = new RoomService();

export const roomController = new Elysia('/api')
  // POST /api/rooms - Create a new room
  .post('/rooms',
    async ({ body, set }) => {
      try {
        const { hostName } = body;

        if (!hostName || hostName.trim().length === 0) {
          set.status = 400;
          return { success: false, error: 'Host name is required' };
        }

        const room = await roomService.createRoom(hostName.trim());

        return {
          success: true,
          data: {
            roomId: room._id.toString(),
            roomCode: room.roomCode,
            hostId: room.hostId
          }
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create room'
        };
      }
    },
    {
      body: t.Object({
        hostName: t.String()
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
        const { playerName } = body;

        if (!playerName || playerName.trim().length === 0) {
          set.status = 400;
          return { success: false, error: 'Player name is required' };
        }

        const player = await roomService.joinRoom(roomCode, playerName.trim());

        return {
          success: true,
          data: {
            playerId: player.playerId,
            roomCode: roomCode.toUpperCase()
          }
        };
      } catch (error) {
        if (error instanceof CustomAppError) {
          set.status = error.statusCode;
          return { success: false, error: error.message };
        }
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to join room'
        };
      }
    },
    {
      body: t.Object({
        playerName: t.String()
      })
    }
  )

  // POST /api/rooms/:roomCode/leave - Leave a room
  .post('/rooms/:roomCode/leave',
    async ({ params, body, set }) => {
      try {
        const { roomCode } = params;
        const { playerId } = body;

        if (!playerId) {
          set.status = 400;
          return { success: false, error: 'Player ID is required' };
        }

        await roomService.leaveRoom(roomCode, playerId);

        return { success: true };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to leave room'
        };
      }
    },
    {
      body: t.Object({
        playerId: t.String()
      })
    }
  )

  // POST /api/rooms/:roomCode/ready - Toggle ready status
  .post('/rooms/:roomCode/ready',
    async ({ params, body, set }) => {
      try {
        const { roomCode } = params;
        const { playerId } = body;

        if (!playerId) {
          set.status = 400;
          return { success: false, error: 'Player ID is required' };
        }

        const allReady = await roomService.toggleReady(roomCode, playerId);

        return {
          success: true,
          data: { allReady }
        };
      } catch (error) {
        if (error instanceof CustomAppError) {
          set.status = error.statusCode;
          return { success: false, error: error.message };
        }
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to toggle ready'
        };
      }
    },
    {
      body: t.Object({
        playerId: t.String()
      })
    }
  )

  // POST /api/rooms/:roomCode/start - Start game (host only)
  .post('/rooms/:roomCode/start',
    async ({ params, set }) => {
      try {
        const { roomCode } = params;

        const room = await roomService.startGame(roomCode);

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
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start game'
        };
      }
    }
  );

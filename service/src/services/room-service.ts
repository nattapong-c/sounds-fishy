import GameRoom, { IPlayer, IGameRoom } from '../models/game-room';
import { NotFoundError, BadRequestError } from '../lib/errors';

/**
 * Result of a player leaving a room
 */
export interface LeaveRoomResult {
  roomDeleted: boolean;
  newHostId?: string | null;
}

export class RoomService {
  /**
   * Generate a unique 6-character room code
   */
  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new game room with host
   */
  async createRoom(hostName: string): Promise<IGameRoom> {
    const roomCode = await this.generateUniqueRoomCode();
    const hostId = crypto.randomUUID();

    const room = await GameRoom.create({
      roomCode,
      hostId,
      players: [{
        playerId: hostId,
        name: hostName,
        role: 'host',
        score: 0,
        isReady: false
      }]
    });

    return room;
  }

  /**
   * Add player to room
   */
  async joinRoom(roomCode: string, playerName: string): Promise<IPlayer> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      throw new NotFoundError('Room not found');
    }
    if (room.status !== 'lobby') {
      throw new BadRequestError('Game already started');
    }
    if (room.players.length >= 8) {
      throw new BadRequestError('Room is full');
    }

    const playerId = crypto.randomUUID();
    const newPlayer: IPlayer = {
      playerId,
      name: playerName,
      role: 'host', // Temporary, will be reassigned on game start
      score: 0,
      isReady: false
    };

    room.players.push(newPlayer);
    await room.save();

    return newPlayer;
  }

  /**
   * Remove player from room
   * @returns Object with roomDeleted flag and newHostId if applicable
   * 
   * Host Transfer Logic:
   * - If leaving player is host:
   *   - If 1+ players remain: Transfer host to first non-host player
   *   - If no players remain: Delete room
   * - If leaving player is not host:
   *   - Just remove player
   */
  async leaveRoom(roomCode: string, playerId: string): Promise<LeaveRoomResult> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      return { roomDeleted: false, newHostId: null };
    }

    const isHostLeaving = playerId === room.hostId;
    const remainingPlayers = room.players.filter(p => p.playerId !== playerId);

    // Case 1: Host is leaving
    if (isHostLeaving) {
      // Check if there are remaining players
      if (remainingPlayers.length > 0) {
        // Transfer host to first non-host player (first player in array that's not leaving)
        const newHost = remainingPlayers[0];
        room.hostId = newHost.playerId;
        room.players = remainingPlayers;
        await room.save();
        
        return {
          roomDeleted: false,
          newHostId: newHost.playerId
        };
      } else {
        // No remaining players - delete the room
        await GameRoom.deleteOne({ _id: room._id });
        return {
          roomDeleted: true,
          newHostId: null
        };
      }
    }

    // Case 2: Non-host is leaving
    room.players = remainingPlayers;
    await room.save();

    // Check if this was the last player (edge case - shouldn't happen with proper host transfer)
    if (remainingPlayers.length === 0) {
      await GameRoom.deleteOne({ _id: room._id });
      return {
        roomDeleted: true,
        newHostId: null
      };
    }

    return {
      roomDeleted: false,
      newHostId: null
    };
  }

  /**
   * Toggle player ready status
   */
  async toggleReady(roomCode: string, playerId: string): Promise<boolean> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    player.isReady = !player.isReady;
    await room.save();

    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady);
    return allReady;
  }

  /**
   * Assign roles for game start
   */
  assignRoles(players: IPlayer[]): void {
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    shuffled[0].role = 'guesser';
    shuffled[1].role = 'bigFish';

    for (let i = 2; i < shuffled.length; i++) {
      shuffled[i].role = 'redHerring';
    }
  }

  /**
   * Start game - assign roles and update status
   */
  async startGame(roomCode: string): Promise<IGameRoom> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      throw new NotFoundError('Room not found');
    }
    if (room.players.length < 3) {
      throw new BadRequestError('Need at least 3 players to start');
    }

    // Assign roles
    this.assignRoles(room.players);
    room.status = 'briefing';
    await room.save();

    return room;
  }

  private async generateUniqueRoomCode(): Promise<string> {
    let code = this.generateRoomCode();
    let exists = await GameRoom.findOne({ roomCode: code });

    while (exists) {
      code = this.generateRoomCode();
      exists = await GameRoom.findOne({ roomCode: code });
    }

    return code;
  }
}

// Export singleton instance for use in controllers and tests
export const roomService = new RoomService();

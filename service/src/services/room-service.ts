import GameRoom, { IPlayer, IGameRoom } from '../models/game-room';
import { NotFoundError, BadRequestError } from '../lib/errors';

/**
 * Result of a player leaving a room
 */
export interface LeaveRoomResult {
  roomDeleted: boolean;
  newHostId?: string | null;
  wasDisconnected: boolean; // Track if disconnect vs explicit leave
}

/**
 * Room Service - Business logic for room operations
 * Handles create, join, leave, and ready operations
 */
export class RoomService {
  /**
   * Generate a unique 6-character room code
   * Uses characters that are easy to read and type (no I, O, 0, 1)
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
   * @param hostName - Name of the host player
   * @param deviceId - Device ID of the host (persistent identity)
   */
  async createRoom(hostName: string, deviceId: string): Promise<IGameRoom> {
    const roomCode = await this.generateUniqueRoomCode();

    const room = await GameRoom.create({
      roomCode,
      hostId: deviceId,
      players: [{
        deviceId,
        name: hostName,
        isHost: true,
        inGameRole: null,
        isOnline: true,
        score: 0,
        isReady: false
      }]
    });

    return room;
  }

  /**
   * Add player to room or reconnect existing player
   * @param roomCode - Room code to join
   * @param playerName - Player's display name
   * @param deviceId - Player's device ID (persistent identity)
   */
  async joinRoom(roomCode: string, playerName: string, deviceId: string): Promise<IPlayer> {
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

    // Check if player with this deviceId already exists (reconnection)
    const existingPlayer = room.players.find(p => p.deviceId === deviceId);
    
    if (existingPlayer) {
      // RECONNECTION: Same deviceId = same player
      existingPlayer.isOnline = true;
      existingPlayer.name = playerName; // Update name if changed
      existingPlayer.lastSeen = new Date();
      await room.save();
      return existingPlayer;
    }

    // NEW PLAYER: Add to room
    const newPlayer: IPlayer = {
      deviceId,
      name: playerName,
      isHost: false,
      inGameRole: null,
      isOnline: true,
      score: 0,
      isReady: false
    };

    room.players.push(newPlayer);
    await room.save();

    return newPlayer;
  }

  /**
   * Remove player from room or mark as disconnected
   * @param roomCode - Room code
   * @param deviceId - Player's device ID
   * @param isDisconnect - true if player disconnected (refresh/close), false if explicit leave
   */
  async leaveRoom(roomCode: string, deviceId: string, isDisconnect: boolean = false): Promise<LeaveRoomResult> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    
    if (!room) {
      return { roomDeleted: false, newHostId: null, wasDisconnected: false };
    }

    const player = room.players.find(p => p.deviceId === deviceId);
    
    if (!player) {
      return { roomDeleted: false, newHostId: null, wasDisconnected: false };
    }

    const isHostLeaving = player.isHost;

    // If host is leaving last player room
    if (room.players.length === 1 && isHostLeaving) {
      if (!isDisconnect) {
        // Host explicitly leaving last player room - delete it
        await GameRoom.deleteOne({ _id: room._id });
        return { roomDeleted: true, newHostId: null, wasDisconnected: isDisconnect };
      } else {
        // Host disconnected - keep room alive, mark as offline
        player.isOnline = false;
        player.lastSeen = new Date();
        await room.save();
        return { roomDeleted: false, newHostId: deviceId, wasDisconnected: isDisconnect };
      }
    }

    // Handle disconnect vs explicit leave
    if (isDisconnect) {
      // Just mark as offline, don't remove from room
      player.isOnline = false;
      player.lastSeen = new Date();
      await room.save();

      // If host disconnects and there are other players, keep host flag but mark offline
      return {
        roomDeleted: false,
        newHostId: isHostLeaving ? deviceId : null,
        wasDisconnected: isDisconnect
      };
    }

    // Explicit leave - remove player from room
    const remainingPlayers = room.players.filter(p => p.deviceId !== deviceId);

    // Host Transfer Logic
    let newHostId: string | null = null;
    if (isHostLeaving && remainingPlayers.length > 0) {
      // Transfer host to first non-host player
      const newHost = remainingPlayers.find(p => !p.isHost) || remainingPlayers[0];
      newHost.isHost = true;
      newHostId = newHost.deviceId;
      room.hostId = newHostId;
    }

    room.players = remainingPlayers;
    await room.save();

    // Edge case: if no players remain after explicit leave
    if (remainingPlayers.length === 0) {
      await GameRoom.deleteOne({ _id: room._id });
      return {
        roomDeleted: true,
        newHostId: null,
        wasDisconnected: isDisconnect
      };
    }

    return {
      roomDeleted: false,
      newHostId,
      wasDisconnected: isDisconnect
    };
  }

  /**
   * Toggle player ready status
   * @param roomCode - Room code
   * @param deviceId - Player's device ID
   * @returns true if all non-host players are ready
   */
  async toggleReady(roomCode: string, deviceId: string): Promise<boolean> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const player = room.players.find(p => p.deviceId === deviceId);
    
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    player.isReady = !player.isReady;
    await room.save();

    // Check if all non-host players are ready
    const nonHostPlayers = room.players.filter(p => !p.isHost);
    const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady);
    
    return allReady;
  }

  /**
   * Assign roles for game start
   * CRITICAL: Host is separate from game roles - host does not get a game role
   * @param players - Array of players to assign roles to
   */
  assignRoles(players: IPlayer[]): void {
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // Separate host from role assignment - host doesn't get a game role
    const host = shuffled.find(p => p.isHost);
    const nonHostPlayers = shuffled.filter(p => !p.isHost);

    // Only assign game roles if we have at least 2 non-host players
    if (nonHostPlayers.length >= 2) {
      nonHostPlayers[0].inGameRole = 'guesser';
      nonHostPlayers[1].inGameRole = 'bigFish';

      for (let i = 2; i < nonHostPlayers.length; i++) {
        nonHostPlayers[i].inGameRole = 'redHerring';
      }
    }
  }

  /**
   * Start game - assign roles and update status
   * @param roomCode - Room code
   */
  async startGame(roomCode: string): Promise<IGameRoom> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    
    if (!room) {
      throw new NotFoundError('Room not found');
    }
    
    // Count non-host players for minimum requirement
    const nonHostPlayers = room.players.filter(p => !p.isHost);
    
    if (nonHostPlayers.length < 2) {
      throw new BadRequestError('Need at least 2 non-host players (3 total with host) to start');
    }

    // Assign roles
    this.assignRoles(room.players);
    room.status = 'briefing';
    await room.save();

    return room;
  }

  /**
   * Generate unique room code (internal helper)
   */
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

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Server } from 'socket.io';
import { io as SocketIOClient } from 'socket.io-client';
import mongoose from 'mongoose';
import GameRoom from '../../models/game-room';
import { roomService } from '../../services/room-service';

/**
 * Integration tests for WebSocket room events
 * Tests real-time player join/leave functionality
 */
describe('WebSocket Room Events Integration', () => {
  let testRoomCode: string;
  let testHostId: string;

  beforeEach(async () => {
    // Clean up database before each test
    await GameRoom.deleteMany({});
    
    // Create a test room
    testRoomCode = 'TEST123';
    testHostId = 'host-test-id';
    
    await GameRoom.create({
      roomCode: testRoomCode,
      hostId: testHostId,
      players: [{
        playerId: testHostId,
        name: 'Host Player',
        role: 'host',
        score: 0,
        isReady: false
      }]
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await GameRoom.deleteMany({});
  });

  describe('Player Join Events', () => {
    test('should broadcast player_joined to all players when new player joins', async () => {
      // Arrange: Create a second player
      const player2Id = 'player-2-id';
      const player2Name = 'Player Two';
      
      // Act: Join the room
      const result = await roomService.joinRoom(testRoomCode, player2Name);
      
      // Assert: Player was added to room
      expect(result.playerId).toBe(player2Id);
      expect(result.name).toBe(player2Name);
      
      // Verify room has 2 players
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room).toBeTruthy();
      expect(room!.players.length).toBe(2);
      expect(room!.players.map(p => p.playerId)).toContain(player2Id);
    });

    test('should update room state visible to all players', async () => {
      // Arrange
      const player2Name = 'Player Two';
      const player3Name = 'Player Three';
      
      // Act: Add two players
      await roomService.joinRoom(testRoomCode, player2Name);
      await roomService.joinRoom(testRoomCode, player3Name);
      
      // Assert: Room state is consistent
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.players.length).toBe(3);
      
      const playerNames = room!.players.map(p => p.name);
      expect(playerNames).toContain('Host Player');
      expect(playerNames).toContain(player2Name);
      expect(playerNames).toContain(player3Name);
    });
  });

  describe('Player Leave Events', () => {
    test('should remove player from room and broadcast player_left', async () => {
      // Arrange: Add a player first
      const player2Id = 'player-2-id';
      await roomService.joinRoom(testRoomCode, 'Player Two');
      
      // Act: Player leaves
      const result = await roomService.leaveRoom(testRoomCode, player2Id);
      
      // Assert: Player was removed
      expect(result.roomDeleted).toBe(false);
      
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.players.length).toBe(1);
      expect(room!.players.map(p => p.playerId)).not.toContain(player2Id);
    });

    test('should transfer host when host leaves and other players remain', async () => {
      // Arrange: Add a player
      const player2Id = 'player-2-id';
      await roomService.joinRoom(testRoomCode, 'Player Two');
      
      // Act: Host leaves
      const result = await roomService.leaveRoom(testRoomCode, testHostId);
      
      // Assert: Host was transferred
      expect(result.roomDeleted).toBe(false);
      expect(result.newHostId).toBe(player2Id);
      
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.hostId).toBe(player2Id);
      expect(room!.players.length).toBe(1);
    });

    test('should delete room when last player (host) leaves', async () => {
      // Act: Host leaves (only player)
      const result = await roomService.leaveRoom(testRoomCode, testHostId);
      
      // Assert: Room was deleted
      expect(result.roomDeleted).toBe(true);
      
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room).toBeNull();
    });

    test('should handle non-host player leaving correctly', async () => {
      // Arrange: Add two players
      const player2Id = 'player-2-id';
      const player3Id = 'player-3-id';
      
      await roomService.joinRoom(testRoomCode, 'Player Two');
      await roomService.joinRoom(testRoomCode, 'Player Three');
      
      // Act: Player 2 leaves (not host)
      const result = await roomService.leaveRoom(testRoomCode, player2Id);
      
      // Assert: Room still exists, host unchanged
      expect(result.roomDeleted).toBe(false);
      expect(result.newHostId).toBeUndefined();
      
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.hostId).toBe(testHostId);
      expect(room!.players.length).toBe(2);
      expect(room!.players.map(p => p.playerId)).toContain(testHostId);
      expect(room!.players.map(p => p.playerId)).toContain(player3Id);
      expect(room!.players.map(p => p.playerId)).not.toContain(player2Id);
    });
  });

  describe('Edge Cases', () => {
    test('should handle leaveRoom for non-existent room gracefully', async () => {
      // Act: Try to leave non-existent room
      const result = await roomService.leaveRoom('NONEXIST', 'some-player');
      
      // Assert: No error, returns false
      expect(result.roomDeleted).toBe(false);
    });

    test('should handle leaveRoom for player not in room', async () => {
      // Arrange: Add a player
      await roomService.joinRoom(testRoomCode, 'Player Two');
      
      // Act: Try to remove non-existent player
      const result = await roomService.leaveRoom(testRoomCode, 'non-existent-player');
      
      // Assert: Room unchanged
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.players.length).toBe(2); // Host + Player Two
    });

    test('should handle multiple players leaving sequentially', async () => {
      // Arrange: Add multiple players
      const player2Id = 'player-2-id';
      const player3Id = 'player-3-id';
      const player4Id = 'player-4-id';
      
      await roomService.joinRoom(testRoomCode, 'Player Two');
      await roomService.joinRoom(testRoomCode, 'Player Three');
      await roomService.joinRoom(testRoomCode, 'Player Four');
      
      // Act: Players leave one by one
      await roomService.leaveRoom(testRoomCode, player2Id);
      await roomService.leaveRoom(testRoomCode, player3Id);
      await roomService.leaveRoom(testRoomCode, player4Id);
      
      // Assert: Only host remains
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.players.length).toBe(1);
      expect(room!.players[0].playerId).toBe(testHostId);
    });

    test('should handle host leaving and then new player leaving', async () => {
      // Arrange: Add players
      const player2Id = 'player-2-id';
      const player3Id = 'player-3-id';
      
      await roomService.joinRoom(testRoomCode, 'Player Two');
      await roomService.joinRoom(testRoomCode, 'Player Three');
      
      // Act: Host leaves (player2 becomes host), then player2 leaves
      await roomService.leaveRoom(testRoomCode, testHostId);
      await roomService.leaveRoom(testRoomCode, player2Id);
      
      // Assert: Player3 is now host
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room).toBeTruthy();
      expect(room!.hostId).toBe(player3Id);
      expect(room!.players.length).toBe(1);
      expect(room!.players[0].playerId).toBe(player3Id);
    });
  });
});

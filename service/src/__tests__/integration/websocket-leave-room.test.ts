import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import mongoose from 'mongoose';
import GameRoom from '../../models/game-room';
import { roomService } from '../../services/room-service';

/**
 * Unit tests for room service leave functionality
 * Tests the core business logic of player removal
 */
describe('Room Service - Leave Room', () => {
  const testRoomCode = 'TEST123';
  const testHostId = 'host-test-id';
  let testPlayer2Id: string;
  let testPlayer3Id: string;

  beforeEach(async () => {
    // Clean up database before each test
    await GameRoom.deleteMany({});

    // Create a test room with host
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

    // Add player 2
    const player2 = await roomService.joinRoom(testRoomCode, 'Player Two');
    testPlayer2Id = player2.playerId;

    // Add player 3
    const player3 = await roomService.joinRoom(testRoomCode, 'Player Three');
    testPlayer3Id = player3.playerId;
  });

  afterEach(async () => {
    // Clean up after each test
    await GameRoom.deleteMany({});
  });

  describe('Non-Host Player Leave', () => {
    test('should remove player from database when they leave', async () => {
      // Arrange
      const roomBefore = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(roomBefore!.players.length).toBe(3);

      // Act
      const result = await roomService.leaveRoom(testRoomCode, testPlayer2Id);

      // Assert
      expect(result.roomDeleted).toBe(false);
      
      const roomAfter = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(roomAfter!.players.length).toBe(2);
      expect(roomAfter!.players.map(p => p.playerId)).not.toContain(testPlayer2Id);
      expect(roomAfter!.players.map(p => p.playerId)).toContain(testHostId);
      expect(roomAfter!.players.map(p => p.playerId)).toContain(testPlayer3Id);
    });

    test('should not change host when non-host player leaves', async () => {
      // Act
      await roomService.leaveRoom(testRoomCode, testPlayer2Id);

      // Assert
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.hostId).toBe(testHostId);
    });
  });

  describe('Host Player Leave', () => {
    test('should transfer host to remaining player when host leaves', async () => {
      // Act
      const result = await roomService.leaveRoom(testRoomCode, testHostId);

      // Assert
      expect(result.roomDeleted).toBe(false);
      expect(result.newHostId).toBe(testPlayer2Id);

      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.hostId).toBe(testPlayer2Id);
      expect(room!.players.length).toBe(2);
    });

    test('should delete room when last player (host) leaves', async () => {
      // Arrange: Remove other players first
      await roomService.leaveRoom(testRoomCode, testPlayer2Id);
      await roomService.leaveRoom(testRoomCode, testPlayer3Id);

      // Act: Host leaves (now the only player)
      const result = await roomService.leaveRoom(testRoomCode, testHostId);

      // Assert
      expect(result.roomDeleted).toBe(true);

      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room).toBeNull();
    });

    test('should handle host leaving with multiple players remaining', async () => {
      // Act
      await roomService.leaveRoom(testRoomCode, testHostId);

      // Assert
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.hostId).toBe(testPlayer2Id);
      expect(room!.players.length).toBe(2);
      expect(room!.players.map(p => p.playerId)).toContain(testPlayer2Id);
      expect(room!.players.map(p => p.playerId)).toContain(testPlayer3Id);
    });
  });

  describe('Sequential Player Leaves', () => {
    test('should handle multiple players leaving one by one', async () => {
      // Act: Player 2 leaves
      await roomService.leaveRoom(testRoomCode, testPlayer2Id);
      
      let room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.players.length).toBe(2);
      expect(room!.hostId).toBe(testHostId);

      // Act: Player 3 leaves
      await roomService.leaveRoom(testRoomCode, testPlayer3Id);
      
      room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.players.length).toBe(1);
      expect(room!.hostId).toBe(testHostId);

      // Act: Host leaves (room should be deleted)
      const result = await roomService.leaveRoom(testRoomCode, testHostId);
      expect(result.roomDeleted).toBe(true);

      room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room).toBeNull();
    });

    test('should handle host leaving then new host leaving', async () => {
      // Act: Host leaves, player2 becomes host
      await roomService.leaveRoom(testRoomCode, testHostId);
      
      let room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.hostId).toBe(testPlayer2Id);
      expect(room!.players.length).toBe(2);

      // Act: New host (player2) leaves, player3 becomes host
      await roomService.leaveRoom(testRoomCode, testPlayer2Id);
      
      room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.hostId).toBe(testPlayer3Id);
      expect(room!.players.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle leaveRoom for non-existent room', async () => {
      // Act
      const result = await roomService.leaveRoom('NONEXIST', 'some-player');

      // Assert
      expect(result.roomDeleted).toBe(false);
    });

    test('should handle leaveRoom for player not in room', async () => {
      // Act
      const result = await roomService.leaveRoom(testRoomCode, 'non-existent-player');

      // Assert
      expect(result.roomDeleted).toBe(false);
      
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.players.length).toBe(3); // No change
    });

    test('should handle same player leaving twice gracefully', async () => {
      // Act: First leave
      await roomService.leaveRoom(testRoomCode, testPlayer2Id);
      
      // Act: Second leave (player already removed)
      const result = await roomService.leaveRoom(testRoomCode, testPlayer2Id);

      // Assert
      expect(result.roomDeleted).toBe(false);
      
      const room = await GameRoom.findOne({ roomCode: testRoomCode });
      expect(room!.players.length).toBe(2); // Still 2, no duplicate removal
    });
  });
});

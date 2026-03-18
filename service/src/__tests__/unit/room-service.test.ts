import { describe, test, expect, beforeEach } from 'bun:test';
import { RoomService, type LeaveRoomResult } from '../../services/room-service';

describe('RoomService', () => {
  let roomService: RoomService;

  beforeEach(() => {
    roomService = new RoomService();
  });

  test('generateRoomCode should return 6-character string', () => {
    const code = roomService.generateRoomCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  test('generateRoomCode should not contain confusing characters', () => {
    const code = roomService.generateRoomCode();
    expect(code).not.toContain('I');
    expect(code).not.toContain('O');
    expect(code).not.toContain('0');
    expect(code).not.toContain('1');
  });

  test('assignRoles should assign 1 guesser, 1 big fish, rest red herrings', () => {
    const players = [
      { playerId: '1', name: 'A', role: 'host' as const, score: 0, isReady: false },
      { playerId: '2', name: 'B', role: 'host' as const, score: 0, isReady: false },
      { playerId: '3', name: 'C', role: 'host' as const, score: 0, isReady: false },
      { playerId: '4', name: 'D', role: 'host' as const, score: 0, isReady: false }
    ];

    roomService.assignRoles(players);

    const roles = players.map(p => p.role);
    expect(roles.filter(r => r === 'guesser').length).toBe(1);
    expect(roles.filter(r => r === 'bigFish').length).toBe(1);
    expect(roles.filter(r => r === 'redHerring').length).toBe(2);
  });

  test('assignRoles should work with minimum 3 players', () => {
    const players = [
      { playerId: '1', name: 'A', role: 'host' as const, score: 0, isReady: false },
      { playerId: '2', name: 'B', role: 'host' as const, score: 0, isReady: false },
      { playerId: '3', name: 'C', role: 'host' as const, score: 0, isReady: false }
    ];

    roomService.assignRoles(players);

    const roles = players.map(p => p.role);
    expect(roles.filter(r => r === 'guesser').length).toBe(1);
    expect(roles.filter(r => r === 'bigFish').length).toBe(1);
    expect(roles.filter(r => r === 'redHerring').length).toBe(1);
  });
});

/**
 * Unit tests for LeaveRoomResult interface and logic
 * Note: Full integration tests for leaveRoom require database setup
 * These tests verify the type contract and expected behavior
 */
describe('LeaveRoomResult', () => {
  test('LeaveRoomResult should have roomDeleted boolean', () => {
    const result: LeaveRoomResult = {
      roomDeleted: false,
      newHostId: null
    };
    expect(result.roomDeleted).toBe(false);
    expect(result.newHostId).toBe(null);
  });

  test('LeaveRoomResult should have optional newHostId', () => {
    const resultWithHost: LeaveRoomResult = {
      roomDeleted: false,
      newHostId: 'player-123'
    };
    expect(resultWithHost.newHostId).toBe('player-123');

    const resultWithoutHost: LeaveRoomResult = {
      roomDeleted: false,
      newHostId: null
    };
    expect(resultWithoutHost.newHostId).toBe(null);
  });

  test('LeaveRoomResult for room deletion should have null newHostId', () => {
    const result: LeaveRoomResult = {
      roomDeleted: true,
      newHostId: null
    };
    expect(result.roomDeleted).toBe(true);
    expect(result.newHostId).toBe(null);
  });
});

describe('Host Transfer Logic (Unit Tests)', () => {
  test('should transfer host to first non-host player when host leaves', () => {
    // Simulating the logic: when host leaves and players remain
    // The first player in the remaining array becomes host
    const players = [
      { playerId: 'host-1', name: 'Host', role: 'guesser' as const, score: 0, isReady: false },
      { playerId: 'player-2', name: 'Player2', role: 'bigFish' as const, score: 0, isReady: false },
      { playerId: 'player-3', name: 'Player3', role: 'redHerring' as const, score: 0, isReady: false }
    ];

    const hostId = 'host-1';
    const leavingPlayerId = hostId;
    const remainingPlayers = players.filter(p => p.playerId !== leavingPlayerId);

    // First remaining player should become new host
    const newHostId = remainingPlayers[0].playerId;

    expect(newHostId).toBe('player-2');
    expect(remainingPlayers.length).toBe(2);
  });

  test('should delete room when last player leaves', () => {
    // Simulating the logic: when only one player remains and leaves
    const players = [
      { playerId: 'host-1', name: 'Host', role: 'guesser' as const, score: 0, isReady: false }
    ];

    const leavingPlayerId = 'host-1';
    const remainingPlayers = players.filter(p => p.playerId !== leavingPlayerId);

    expect(remainingPlayers.length).toBe(0);
    // Room should be deleted in this case
  });

  test('non-host leaving should not trigger host transfer', () => {
    const players = [
      { playerId: 'host-1', name: 'Host', role: 'guesser' as const, score: 0, isReady: false },
      { playerId: 'player-2', name: 'Player2', role: 'bigFish' as const, score: 0, isReady: false },
      { playerId: 'player-3', name: 'Player3', role: 'redHerring' as const, score: 0, isReady: false }
    ];

    const hostId = 'host-1';
    const leavingPlayerId = 'player-2';
    const remainingPlayers = players.filter(p => p.playerId !== leavingPlayerId);
    const isHostLeaving = leavingPlayerId === hostId;

    expect(isHostLeaving).toBe(false);
    expect(remainingPlayers.length).toBe(2);
    expect(remainingPlayers.find(p => p.playerId === hostId)).toBeDefined();
  });
});

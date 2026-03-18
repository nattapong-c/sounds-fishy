import { describe, test, expect, beforeEach } from 'bun:test';
import { RoomService } from '../room-service';

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

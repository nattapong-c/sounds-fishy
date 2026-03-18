// Centralized model exports
// All TypeScript interfaces and Mongoose models are exported from here

export { default, IPlayer, IGameRoom } from './game-room';

// Re-export types for convenience
export type {
  IPlayer as Player,
  IGameRoom as GameRoom
} from './game-room';

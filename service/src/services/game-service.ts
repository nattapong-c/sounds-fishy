import GameRoom, { IGameRoom, IPlayer, IAiConfig } from '../models/game-room';
import { questionBankService } from '../services/question-bank-service';
import { NotFoundError, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';

/**
 * Game Service
 * Handles game logic for guessing phase
 * Manages role assignment, question selection, and lie distribution
 */

export interface StartGameResult {
  room: IGameRoom;
}

export interface GenerateLieResult {
  lieSuggestion: string;
  usedFallback: boolean;
}

export interface RoleSpecificPayload {
  question: string;
  role: 'guesser' | 'bigFish' | 'redHerring' | 'spectator';
  secretWord?: string;
  fakeAnswer?: string;
  lieSuggestion?: string;
  bluffSuggestions?: string[];
  isHost?: boolean;
}

export class GameService {
  /**
   * Start guessing phase
   * - Fetch question from question bank (or word bank fallback)
   * - Store in room's aiConfig
   * - Assign roles if not already assigned
   * - Update room status to 'guessing'
   */
  async startGame(roomCode: string): Promise<StartGameResult> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.status !== 'lobby') {
      throw new BadRequestError('Game has already started');
    }

    // Count total players (host + players) for role assignment
    const totalPlayers = room.players.length;
    if (totalPlayers < 3) {
      throw new BadRequestError('Need at least 3 players to start');
    }

    // Fetch question from question bank
    const questionData = await questionBankService.getRandomQuestion(totalPlayers);

    // Store question data in room
    room.aiConfig = {
      question: questionData.question,
      correctAnswer: questionData.correctAnswer,
      bluffSuggestions: questionData.bluffSuggestions,
      generatedAt: new Date(),
      model: questionData.model,
    };

    // Set room-level fields for easy access
    room.question = questionData.question;
    room.secretWord = questionData.correctAnswer;

    // Assign roles if not already done
    this._assignRoles(room.players);

    // Update status to 'guessing' (not 'briefing')
    room.status = 'guessing';
    await room.save();

    logger.info({ roomCode, question: questionData.question }, 'Guessing phase started');
    logger.info({ roomCode, source: questionData.usedFallback ? 'Word Bank' : 'Question Bank' }, 'Data source');

    return {
      room,
    };
  }

  /**
   * Generate lie for Red Herring player
   */
  async generateLieForPlayer(
    roomCode: string,
    playerId: string
  ): Promise<GenerateLieResult> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const player = room.players.find(p => p.deviceId === playerId);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    if (player.inGameRole !== 'redHerring') {
      throw new BadRequestError('Only Red Herrings can generate lies');
    }

    if (!room.aiConfig) {
      throw new BadRequestError('Round data not generated yet');
    }

    // Collect existing answers from other players
    const existingAnswers = room.players
      .filter(p => p.deviceId !== playerId && p.generatedLie)
      .map(p => p.generatedLie!);

    // Add the correct answer to avoid duplicates
    if (room.aiConfig.correctAnswer) {
      existingAnswers.push(room.aiConfig.correctAnswer);
    }

    // Generate lie suggestion from question bank
    const lieResult = await questionBankService.getRandomLieSuggestion(existingAnswers);

    // Store generated lie for player
    player.generatedLie = lieResult.lieSuggestion;
    await room.save();

    logger.info({ playerId, roomCode }, 'Lie generated');

    return {
      lieSuggestion: lieResult.lieSuggestion,
      usedFallback: lieResult.usedFallback,
    };
  }

  /**
   * Get role-specific payload for start_round event
   */
  getRoleSpecificPayload(player: IPlayer, room: IGameRoom): RoleSpecificPayload {
    const question = room.question || room.aiConfig?.question || 'Question not generated';
    const bluffSuggestions = room.aiConfig?.bluffSuggestions || [];

    switch (player.inGameRole) {
      case 'guesser':
        return {
          question,
          role: 'guesser',
        };

      case 'bigFish':
        return {
          question,
          secretWord: room.secretWord || room.aiConfig?.correctAnswer || 'Secret word not available',
          role: 'bigFish',
        };

      case 'redHerring':
        // Assign unique fake answer and lie suggestion to each Red Herring
        const redHerringIndex = this._getRedHerringIndex(player, room.players);
        const fakeAnswer = bluffSuggestions[redHerringIndex % bluffSuggestions.length] || 'A lie';
        const lieSuggestion = bluffSuggestions[(redHerringIndex + 1) % bluffSuggestions.length] || 'Another lie';
        
        return {
          question,
          fakeAnswer,  // MANDATORY - what they must say
          lieSuggestion,  // Optional hint
          bluffSuggestions,  // For reference
          role: 'redHerring',
        };

      default:
        // Host or unassigned - show spectator view
        return {
          question,
          role: 'spectator',
          isHost: player.isHost,
        };
    }
  }

  /**
   * Get the index of this Red Herring among all Red Herrings
   * Used to assign unique fake answers
   */
  private _getRedHerringIndex(player: IPlayer, players: IPlayer[]): number {
    const redHerrings = players.filter(p => p.inGameRole === 'redHerring');
    return redHerrings.findIndex(p => p.deviceId === player.deviceId);
  }

  /**
   * Assign roles to players (1 Guesser, 1 Big Fish, rest Red Herrings)
   * Host is included in role assignment (all players play)
   */
  private _assignRoles(players: IPlayer[]): void {
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // Minimum 3 players needed for the game
    if (shuffled.length >= 3) {
      shuffled[0].inGameRole = 'guesser';
      shuffled[1].inGameRole = 'bigFish';

      for (let i = 2; i < shuffled.length; i++) {
        shuffled[i].inGameRole = 'redHerring';
      }
    }
  }
}

// Export singleton instance
export const gameService = new GameService();

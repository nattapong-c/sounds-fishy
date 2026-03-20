import GameRoom, { IGameRoom, IPlayer, IAiConfig } from '../models/game-room';
import { questionBankService } from '../services/question-bank-service';
import { NotFoundError, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';

/**
 * Game Service
 * Handles game logic for briefing phase and beyond
 * Manages role assignment, ready status, and lie generation
 */

export interface StartBriefingResult {
  room: IGameRoom;
  aiConfig: IAiConfig;
}

export interface GenerateLieResult {
  lieSuggestion: string;
  usedFallback: boolean;
}

export interface RoleSpecificPayload {
  question: string;
  role: 'guesser' | 'bigFish' | 'redHerring' | 'spectator';
  secretWord?: string;
  canGenerateLie?: boolean;
  bluffSuggestions?: string[];
  isHost?: boolean;
}

export class GameService {
  /**
   * Start briefing phase
   * - Fetch question from question bank (or word bank fallback)
   * - Store in room's aiConfig
   * - Assign roles if not already assigned
   * - Update room status to 'briefing'
   */
  async startBriefing(roomCode: string): Promise<StartBriefingResult> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.status !== 'lobby') {
      throw new BadRequestError('Game has already started');
    }

    // Count non-host players for role assignment
    const nonHostPlayers = room.players.filter(p => !p.isHost);
    if (nonHostPlayers.length < 2) {
      throw new BadRequestError('Need at least 2 non-host players to start');
    }

    // Fetch question from question bank
    const questionData = await questionBankService.getRandomQuestion(nonHostPlayers.length);

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

    // Update status
    room.status = 'briefing';
    await room.save();

    logger.info({ roomCode, question: questionData.question }, 'Briefing started');
    logger.info({ roomCode, source: questionData.usedFallback ? 'Word Bank' : 'Question Bank' }, 'Data source');

    return {
      room,
      aiConfig: room.aiConfig,
    };
  }

  /**
   * Check if all players are ready
   */
  checkAllPlayersReady(room: IGameRoom): boolean {
    // Only check non-host players
    const nonHostPlayers = room.players.filter(p => !p.isHost);

    if (nonHostPlayers.length === 0) {
      return false;
    }

    return nonHostPlayers.every(p => p.isReady);
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
   * Toggle player ready status and check if all ready
   */
  async toggleReadyAndCheck(roomCode: string, playerId: string): Promise<{
    allReady: boolean;
    room: IGameRoom;
  }> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const player = room.players.find(p => p.deviceId === playerId);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Toggle ready status
    player.isReady = !player.isReady;
    await room.save();

    // Check if all non-host players are ready
    const allReady = this.checkAllPlayersReady(room);

    return {
      allReady,
      room,
    };
  }

  /**
   * Get role-specific payload for start_round event
   */
  getRoleSpecificPayload(player: IPlayer, room: IGameRoom): RoleSpecificPayload {
    const question = room.question || room.aiConfig?.question || 'Question not generated';

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
        return {
          question,
          canGenerateLie: true,
          bluffSuggestions: room.aiConfig?.bluffSuggestions || [],
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
   * Assign roles to players (1 Guesser, 1 Big Fish, rest Red Herrings)
   * Host does not get a game role
   */
  private _assignRoles(players: IPlayer[]): void {
    const shuffled = [...players].sort(() => Math.random() - 0.5);

    // Separate host from role assignment
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
}

// Export singleton instance
export const gameService = new GameService();

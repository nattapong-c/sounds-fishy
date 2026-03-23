/**
 * Game State Types for Sounds Fishy
 */

/**
 * Player roles in the game
 */
export type GameRole = 'guesser' | 'blueFish' | 'redFish';

/**
 * Room status
 */
export type RoomStatus = 'lobby' | 'playing' | 'guessing' | 'round_end' | 'completed';

/**
 * Fake Answer with Lie Hint
 */
export interface FakeAnswer {
    answer: string;
    hint: string;
}

/**
 * Question data structure
 */
export interface Question {
    question: string;
    correctAnswer?: string;
    fakeAnswers?: FakeAnswer[];
}

/**
 * Game payload sent to players based on their role
 */
export interface GamePayload {
    type: 'game_started';
    role: GameRole;
    question: string;
    correctAnswer?: string;      // Blue Fish only
    fakeAnswer?: string;         // Red Fish only
    lieSuggestion?: string;      // Red Fish only
}

/**
 * Player score tracking
 */
export interface PlayerScore {
    totalPoints: number;
    tempPoints: number;
    roundsAsGuesser: number;
    roundsAsBlueFish: number;
    roundsAsRedFish: number;
}

/**
 * Extended room state with game fields
 */
export interface GameRoomState {
    roomId: string;
    status: RoomStatus;
    players: Array<{
        id: string;
        name: string;
        deviceId: string;
        isAdmin: boolean;
        isOnline: boolean;
        inGameRole: GameRole | null;
    }>;
    question?: string | null;
    correctAnswer?: string | null;
    fakeAnswersDistribution?: Record<string, FakeAnswer>; // playerId -> {answer, hint}
    currentRound?: number;
    lastGuesserId?: string | null;
    eliminatedPlayers?: string[];
    currentTempPoints?: number;
    scores?: Record<string, PlayerScore>;
}

/**
 * Game result for a round
 */
export interface RoundResult {
    round: number;
    guesserId: string;
    blueFishId: string;
    redFishIds: string[];
    winner: 'guesser' | 'blueFish' | 'redFish';
    pointsAwarded: number;
}

/**
 * Player ranking for end game
 */
export interface PlayerRanking {
    position: number;
    playerId: string;
    playerName: string;
    totalPoints: number;
    isTied: boolean;
}

/**
 * Guess submission result
 */
export interface GuessResult {
    type: 'guess_submitted';
    targetPlayerId: string;
    isCorrect: boolean;
    tempPoints: number;
    eliminatedPlayers: string[];
    room: GameRoomState;
}

/**
 * Round start payload
 */
export interface RoundStartPayload {
    type: 'round_started';
    round: number;
    room: GameRoomState;
    playerDataMap: Record<string, {
        role: GameRole;
        question: string;
        correctAnswer?: string;
        fakeAnswer?: string;
        lieSuggestion?: string;
    }>;
}

/**
 * Game end payload
 */
export interface GameEndPayload {
    type: 'game_ended';
    room: GameRoomState;
    rankings: PlayerRanking[];
}

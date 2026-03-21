import { IPlayer } from '../models/room';
import { logger } from '../lib/logger';

/**
 * Role Assignment Service
 * Handles assignment of game roles (Guesser, Blue Fish, Red Fish)
 */

/**
 * Assign roles to players for a new round
 * - Rotates Guesser to next player who hasn't been Guesser yet
 * - Randomly assigns Blue Fish from remaining players
 * - Rest become Red Fish
 */
export function assignRoles(
    players: IPlayer[],
    lastGuesserId?: string | null
): {
    guesserId: string;
    blueFishId: string;
    redFishIds: string[];
    assignments: Map<string, 'guesser' | 'blueFish' | 'redFish'>;
} {
    if (players.length < 4) {
        throw new Error('Minimum 4 players required');
    }

    logger.info({ playerCount: players.length, lastGuesserId }, 'Assigning roles');

    // Create a copy of players to shuffle
    const playerPool = [...players];
    
    // Find next Guesser (rotate through all players)
    let guesserIndex = 0;
    if (lastGuesserId) {
        const lastGuesserIndex = playerPool.findIndex(p => p.id === lastGuesserId);
        if (lastGuesserIndex !== -1) {
            guesserIndex = (lastGuesserIndex + 1) % playerPool.length;
        }
    }

    // Assign Guesser
    const guesser = playerPool[guesserIndex];
    const assignments = new Map<string, 'guesser' | 'blueFish' | 'redFish'>();
    assignments.set(guesser.id, 'guesser');
    
    logger.info({ guesserId: guesser.id, guesserName: guesser.name }, 'Assigned Guesser');

    // Remove Guesser from pool
    const remainingPlayers = playerPool.filter((_, index) => index !== guesserIndex);
    
    // Randomly select Blue Fish from remaining
    const blueFishIndex = Math.floor(Math.random() * remainingPlayers.length);
    const blueFish = remainingPlayers[blueFishIndex];
    assignments.set(blueFish.id, 'blueFish');
    
    logger.info({ blueFishId: blueFish.id, blueFishName: blueFish.name }, 'Assigned Blue Fish');

    // Rest are Red Fish
    const redFishIds: string[] = [];
    remainingPlayers.forEach((player, index) => {
        if (index !== blueFishIndex) {
            assignments.set(player.id, 'redFish');
            redFishIds.push(player.id);
        }
    });

    logger.info({ redFishCount: redFishIds.length }, 'Assigned Red Fish');

    return {
        guesserId: guesser.id,
        blueFishId: blueFish.id,
        redFishIds,
        assignments
    };
}

/**
 * Get players who have NOT been Guesser yet
 */
export function getPlayersWhoHaventBeenGuesser(
    players: IPlayer[],
    gameHistory: Array<{ guesserId: string }> = []
): IPlayer[] {
    const guesserIds = new Set(gameHistory.map(h => h.guesserId));
    return players.filter(p => !guesserIds.has(p.id));
}

/**
 * Check if all players have been Guesser
 */
export function allPlayersBeenGuesser(
    players: IPlayer[],
    gameHistory: Array<{ guesserId: string }> = []
): boolean {
    const guesserIds = new Set(gameHistory.map(h => h.guesserId));
    return players.every(p => guesserIds.has(p.id));
}

/**
 * Get the next Guesser based on rotation
 */
export function getNextGuesserId(
    players: IPlayer[],
    lastGuesserId?: string | null
): string {
    if (!lastGuesserId || players.length === 0) {
        return players[0].id;
    }

    const lastIndex = players.findIndex(p => p.id === lastGuesserId);
    if (lastIndex === -1) {
        return players[0].id;
    }

    const nextIndex = (lastIndex + 1) % players.length;
    return players[nextIndex].id;
}

import { logger } from '../lib/logger';

/**
 * Scoring System Service
 * Handles all scoring logic for Sounds Fishy game
 * 
 * Scoring Rules:
 * - Guesser eliminates Red Fish: +1 temp point (accumulative)
 * - Guesser eliminates Blue Fish: temp points reset to 0
 * - All Red Fish eliminated: Guesser keeps temp points, Blue Fish gets 1 point
 * - Blue Fish eliminated (wrong guess): Remaining Red Fish each get 1 point
 */

/**
 * Calculate Guesser's temporary points after elimination
 */
export function calculateGuesserScore(
    isCorrect: boolean,  // true if eliminated Red Fish, false if Blue Fish
    currentTempPoints: number
): number {
    if (isCorrect) {
        // Correct guess: +1 temp point
        return currentTempPoints + 1;
    } else {
        // Wrong guess (Blue Fish): reset to 0
        return 0;
    }
}

/**
 * Award points at round end based on game outcome
 */
export function awardRoundPoints(
    scores: Map<string, { totalPoints: number; tempPoints: number; roundsAsGuesser: number; roundsAsBlueFish: number; roundsAsRedFish: number }>,
    guesserId: string,
    blueFishId: string,
    redFishIds: string[],
    winner: 'guesser' | 'blueFish' | 'redFish',
    tempPoints: number
): void {
    logger.info({ guesserId, blueFishId, redFishIds, winner, tempPoints }, 'Awarding round points');

    if (winner === 'guesser') {
        // Guesser eliminated all Red Fish correctly
        // Guesser keeps all temp points
        const guesserScore = scores.get(guesserId);
        if (guesserScore) {
            guesserScore.totalPoints += tempPoints;
            logger.info({ guesserId, pointsAwarded: tempPoints }, 'Guesser awarded temp points');
        }

        // Blue Fish gets 1 point for surviving until end
        const blueFishScore = scores.get(blueFishId);
        if (blueFishScore) {
            blueFishScore.totalPoints += 1;
            logger.info({ blueFishId, pointsAwarded: 1 }, 'Blue Fish awarded survival point');
        }
    } else if (winner === 'blueFish' || winner === 'redFish') {
        // Guesser picked Blue Fish (wrong guess)
        // Remaining Red Fish each get 1 point
        redFishIds.forEach(redFishId => {
            const redFishScore = scores.get(redFishId);
            if (redFishScore) {
                redFishScore.totalPoints += 1;
                logger.info({ redFishId, pointsAwarded: 1 }, 'Red Fish awarded point for Guesser mistake');
            }
        });
    }
}

/**
 * Determine round winner based on elimination
 */
export function determineRoundWinner(
    eliminatedPlayerRole: 'blueFish' | 'redFish',
    remainingRedFishCount: number
): 'guesser' | 'blueFish' | 'redFish' {
    if (eliminatedPlayerRole === 'redFish') {
        if (remainingRedFishCount === 0) {
            // All Red Fish eliminated - Guesser wins
            return 'guesser';
        } else {
            // Still more Red Fish to eliminate - game continues
            return 'ongoing';
        }
    } else {
        // Blue Fish eliminated - Blue Fish/Red Fish win
        return 'redFish';
    }
}

/**
 * Update player role counts in scores
 */
export function updateRoleCounts(
    scores: Map<string, { totalPoints: number; tempPoints: number; roundsAsGuesser: number; roundsAsBlueFish: number; roundsAsRedFish: number }>,
    guesserId: string,
    blueFishId: string,
    redFishIds: string[]
): void {
    // Update Guesser count
    const guesserScore = scores.get(guesserId);
    if (guesserScore) {
        guesserScore.roundsAsGuesser += 1;
    }

    // Update Blue Fish count
    const blueFishScore = scores.get(blueFishId);
    if (blueFishScore) {
        blueFishScore.roundsAsBlueFish += 1;
    }

    // Update Red Fish counts
    redFishIds.forEach(redFishId => {
        const redFishScore = scores.get(redFishId);
        if (redFishScore) {
            redFishScore.roundsAsRedFish += 1;
        }
    });
}

/**
 * Get final rankings sorted by total points
 */
export interface PlayerRanking {
    position: number;
    playerId: string;
    playerName: string;
    totalPoints: number;
    isTied: boolean;
}

export function calculateRankings(
    players: Array<{ id: string; name: string }>,
    scores: Map<string, { totalPoints: number; tempPoints: number; roundsAsGuesser: number; roundsAsBlueFish: number; roundsAsRedFish: number }>
): PlayerRanking[] {
    // Create array with player info and scores
    const playerScores = players.map(player => {
        const score = scores.get(player.id);
        return {
            playerId: player.id,
            playerName: player.name,
            totalPoints: score?.totalPoints || 0
        };
    });

    // Sort by total points descending
    playerScores.sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign positions with tie handling
    const rankings: PlayerRanking[] = [];
    let currentPosition = 1;
    let previousPoints = -1;

    playerScores.forEach((player, index) => {
        if (player.totalPoints !== previousPoints) {
            currentPosition = index + 1;
        }

        rankings.push({
            position: currentPosition,
            playerId: player.playerId,
            playerName: player.playerName,
            totalPoints: player.totalPoints,
            isTied: index > 0 && player.totalPoints === playerScores[index - 1].totalPoints
        });

        previousPoints = player.totalPoints;
    });

    return rankings;
}

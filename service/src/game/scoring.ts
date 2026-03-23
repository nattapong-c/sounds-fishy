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
    tempPoints: number,
    eliminatedRedFishIds?: string[] // Red Fish who were eliminated before Blue Fish
): void {
    logger.info({ guesserId, blueFishId, redFishIds, winner, tempPoints, eliminatedRedFishIds }, 'Awarding round points');

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
        // Only NON-eliminated Red Fish get 1 point (survival bonus)
        const eliminatedSet = new Set(eliminatedRedFishIds || []);
        
        redFishIds.forEach(redFishId => {
            // Skip Red Fish who were already eliminated
            if (eliminatedSet.has(redFishId)) {
                logger.info({ redFishId, pointsAwarded: 0 }, 'Red Fish already eliminated, no points');
                return;
            }
            
            // Award point to surviving Red Fish
            const redFishScore = scores.get(redFishId);
            if (redFishScore) {
                redFishScore.totalPoints += 1;
                logger.info({ redFishId, pointsAwarded: 1 }, 'Red Fish awarded survival bonus point');
            }
        });
    }
}

/**
 * Determine round winner based on elimination
 * Returns 'ongoing' if game continues, otherwise the winner
 */
export function determineRoundWinner(
    eliminatedPlayerRole: 'blueFish' | 'redFish',
    remainingRedFishCount: number
): 'guesser' | 'blueFish' | 'redFish' | 'ongoing' {
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

/**
 * Points breakdown for a single player at round end
 */
export interface PointsBreakdown {
    playerId: string;
    playerName: string;
    pointsEarned: number;
    reason: string;
    totalPoints: number;
}

/**
 * Generate points breakdown for all players at round end
 */
export function generatePointsBreakdown(
    players: Array<{ id: string; name: string; inGameRole?: string | null }>,
    scores: Map<string, { totalPoints: number; tempPoints: number; roundsAsGuesser: number; roundsAsBlueFish: number; roundsAsRedFish: number }>,
    winner: 'guesser' | 'blueFish' | 'redFish',
    tempPoints: number,
    eliminatedRedFishIds?: string[] // Red Fish who were eliminated before Blue Fish
): PointsBreakdown[] {
    const breakdown: PointsBreakdown[] = [];
    const eliminatedSet = new Set(eliminatedRedFishIds || []);

    players.forEach(player => {
        const score = scores.get(player.id);
        const currentTotal = score?.totalPoints || 0;

        let pointsEarned = 0;
        let reason = '';

        if (player.inGameRole === 'guesser') {
            if (winner === 'guesser') {
                pointsEarned = tempPoints;
                reason = `Guesser: ${tempPoints} temp point${tempPoints !== 1 ? 's' : ''} converted`;
            } else {
                pointsEarned = 0;
                reason = 'Guesser: Wrong guess, points reset';
            }
        } else if (player.inGameRole === 'blueFish') {
            if (winner === 'guesser') {
                pointsEarned = 1;
                reason = 'Blue Fish: 1 survival bonus';
            } else {
                pointsEarned = 0;
                reason = 'Blue Fish: Eliminated (no points)';
            }
        } else if (player.inGameRole === 'redFish') {
            if (winner === 'guesser') {
                pointsEarned = 0;
                reason = 'Red Fish: Eliminated (no points)';
            } else {
                // Blue Fish eliminated - check if this Red Fish survived
                if (eliminatedSet.has(player.id)) {
                    pointsEarned = 0;
                    reason = 'Red Fish: Eliminated before Blue Fish (no points)';
                } else {
                    pointsEarned = 1;
                    reason = 'Red Fish: 1 survival bonus (Blue Fish eliminated)';
                }
            }
        }

        breakdown.push({
            playerId: player.id,
            playerName: player.name,
            pointsEarned,
            reason,
            totalPoints: currentTotal
        });
    });

    // Sort by points earned (descending), then by total points
    breakdown.sort((a, b) => {
        if (b.pointsEarned !== a.pointsEarned) {
            return b.pointsEarned - a.pointsEarned;
        }
        return b.totalPoints - a.totalPoints;
    });

    return breakdown;
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

import { K_FACTOR } from '../constants/defaults';

/**
 * Calculate expected score for a player
 * @param {number} playerElo - Player's current ELO rating
 * @param {number} opponentElo - Opponent's current ELO rating
 * @returns {number} Expected score (0 to 1)
 */
function getExpectedScore(playerElo, opponentElo) {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

/**
 * Calculate new ELO ratings after a match
 * @param {number} winnerElo - Winner's current ELO rating
 * @param {number} loserElo - Loser's current ELO rating
 * @returns {object} Object containing new ELO ratings for both players
 */
export function calculateNewElo(winnerElo, loserElo) {
  // Calculate expected scores
  const winnerExpected = getExpectedScore(winnerElo, loserElo);
  const loserExpected = getExpectedScore(loserElo, winnerElo);

  // Calculate new ratings
  // Winner gets 1 point (won), Loser gets 0 points (lost)
  const winnerNewElo = winnerElo + K_FACTOR * (1 - winnerExpected);
  const loserNewElo = loserElo + K_FACTOR * (0 - loserExpected);

  return {
    winnerNewElo: Math.round(winnerNewElo),
    loserNewElo: Math.round(loserNewElo),
    eloChange: Math.round(winnerNewElo - winnerElo),
  };
}

/**
 * Calculate win probability
 * @param {number} playerElo - Player's ELO rating
 * @param {number} opponentElo - Opponent's ELO rating
 * @returns {number} Win probability as percentage (0-100)
 */
export function getWinProbability(playerElo, opponentElo) {
  const expected = getExpectedScore(playerElo, opponentElo);
  return Math.round(expected * 100);
}

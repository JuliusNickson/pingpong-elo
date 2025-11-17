import { BASE_K_FACTOR, MIN_RD, MAX_RD, RD_DECAY_PER_MATCH } from '../constants/defaults';

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
 * Calculate dynamic K-factor based on Rating Deviation (RD)
 * Higher RD = more uncertainty = bigger K-factor = faster rating changes
 * @param {number} rd - Rating Deviation (50-350)
 * @returns {number} K-factor
 */
function getDynamicK(rd) {
  // K = baseK × (RD / 200)
  // This makes K range from ~5 (very stable) to ~35 (very uncertain)
  const k = BASE_K_FACTOR * (rd / 200);
  return Math.round(k);
}

/**
 * Update Rating Deviation after a match
 * Playing decreases RD (more confidence in rating)
 * @param {number} currentRd - Current RD value
 * @returns {number} New RD value
 */
function updateRdAfterMatch(currentRd) {
  const newRd = currentRd - RD_DECAY_PER_MATCH;
  return Math.max(MIN_RD, newRd); // Don't go below minimum
}

/**
 * Calculate new ELO ratings after a match with dynamic K-factor
 * @param {number} winnerElo - Winner's current ELO rating
 * @param {number} loserElo - Loser's current ELO rating
 * @param {number} winnerRd - Winner's Rating Deviation
 * @param {number} loserRd - Loser's Rating Deviation
 * @returns {object} Object containing new ELO ratings and RD values
 */
export function calculateNewElo(winnerElo, loserElo, winnerRd = 300, loserRd = 300) {
  // Calculate expected scores
  const winnerExpected = getExpectedScore(winnerElo, loserElo);
  const loserExpected = getExpectedScore(loserElo, winnerElo);

  // Get dynamic K-factors based on RD
  const winnerK = getDynamicK(winnerRd);
  const loserK = getDynamicK(loserRd);

  // Calculate new ratings
  // Winner gets 1 point (won), Loser gets 0 points (lost)
  const winnerNewElo = winnerElo + winnerK * (1 - winnerExpected);
  const loserNewElo = loserElo + loserK * (0 - loserExpected);

  // Update RD values (decrease after playing)
  const winnerNewRd = updateRdAfterMatch(winnerRd);
  const loserNewRd = updateRdAfterMatch(loserRd);

  return {
    winnerNewElo: Math.round(winnerNewElo),
    loserNewElo: Math.round(loserNewElo),
    winnerNewRd: winnerNewRd,
    loserNewRd: loserNewRd,
    eloChange: Math.round(winnerNewElo - winnerElo),
    winnerK: winnerK,
    loserK: loserK,
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

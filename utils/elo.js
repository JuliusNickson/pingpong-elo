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

/**
 * Calculate ELO change for a single match outcome
 * @param {number} playerRating - Player's current rating
 * @param {number} opponentRating - Opponent's current rating
 * @param {number} score - Match result (1 = win, 0 = loss)
 * @param {number} K - K-factor (default 32)
 * @returns {number} New rating after this match
 */
function calculateElo(playerRating, opponentRating, score, K = 32) {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return playerRating + K * (score - expected);
}

/**
 * Process multiple matches between two players sequentially
 * Simulates each game one by one, updating ratings after each
 * @param {object} playerA - Player A object with rating
 * @param {object} playerB - Player B object with rating
 * @param {number} winsA - Number of wins for Player A
 * @param {number} winsB - Number of wins for Player B
 * @returns {object} Final ratings for both players
 */
export function processBulkMatchResults(playerA, playerB, winsA, winsB) {
  let ratingA = playerA.rating;
  let ratingB = playerB.rating;

  // Simulate wins for A
  for (let i = 0; i < winsA; i++) {
    const newRatingA = calculateElo(ratingA, ratingB, 1);
    const newRatingB = calculateElo(ratingB, ratingA, 0);
    ratingA = newRatingA;
    ratingB = newRatingB;
  }

  // Simulate wins for B
  for (let i = 0; i < winsB; i++) {
    const newRatingA = calculateElo(ratingA, ratingB, 0);
    const newRatingB = calculateElo(ratingB, ratingA, 1);
    ratingA = newRatingA;
    ratingB = newRatingB;
  }

  return {
    newA: Math.round(ratingA),
    newB: Math.round(ratingB),
    changeA: Math.round(ratingA - playerA.rating),
    changeB: Math.round(ratingB - playerB.rating),
  };
}

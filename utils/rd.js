import { MAX_RD, RD_INCREASE_PER_DAY } from '../constants/defaults';

/**
 * Calculate RD increase based on days of inactivity
 * @param {number} currentRd - Current Rating Deviation
 * @param {number} lastPlayed - Timestamp of last match
 * @returns {number} New RD value
 */
export function calculateRdWithInactivity(currentRd, lastPlayed) {
  if (!lastPlayed) return currentRd;

  const now = Date.now();
  const daysSinceLastMatch = Math.floor((now - lastPlayed) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastMatch === 0) return currentRd;

  // Increase RD by RD_INCREASE_PER_DAY for each day inactive
  const rdIncrease = daysSinceLastMatch * RD_INCREASE_PER_DAY;
  const newRd = currentRd + rdIncrease;

  // Cap at maximum RD
  return Math.min(MAX_RD, newRd);
}

/**
 * Apply inactivity penalty to all players
 * Call this when loading players to update their RD
 * @param {Array} players - Array of player objects
 * @returns {Array} Players with updated RD values
 */
export function applyInactivityPenalty(players) {
  return players.map(player => ({
    ...player,
    rd: calculateRdWithInactivity(player.rd || 300, player.lastPlayed),
  }));
}

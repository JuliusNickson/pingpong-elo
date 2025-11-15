/**
 * Default ELO rating for new players
 * Standard starting ELO in most systems
 */
export const DEFAULT_ELO = 1000;

/**
 * K-Factor for ELO calculation
 * Determines how much ratings change after each match
 * Higher values = more volatile ratings
 * Common values: 16 (FIDE for 2400+), 24 (intermediate), 32 (beginners/casual)
 */
export const K_FACTOR = 32;

/**
 * Minimum ELO rating
 * Prevents ratings from going too low
 */
export const MIN_ELO = 100;

/**
 * Maximum ELO rating
 * Practical upper limit for the system
 */
export const MAX_ELO = 3000;

/**
 * Default ELO rating for new players
 * Standard starting ELO in most systems
 */
export const DEFAULT_ELO = 1000;

/**
 * Base K-Factor for ELO calculation (before RD adjustment)
 * This gets multiplied by (RD / 200) for dynamic K-factor
 */
export const BASE_K_FACTOR = 20;

/**
 * Rating Deviation (RD) constants
 * RD represents uncertainty in a player's rating
 */
export const DEFAULT_RD = 300;  // New players are uncertain
export const MIN_RD = 50;       // Minimum uncertainty (very stable players)
export const MAX_RD = 350;      // Maximum uncertainty
export const RD_DECAY_PER_MATCH = 5;  // RD decreases when playing
export const RD_INCREASE_PER_DAY = 2; // RD increases with inactivity

/**
 * Minimum ELO rating
 * Prevents ratings from going too low
 */
export const MIN_ELO = 100;

/**
 * App Color Scheme
 */
export const COLORS = {
  background: '#0E0E10',        // Dark matte background
  primary: '#00E676',           // Neon green (sports vibe)
  secondary: '#2979FF',         // Neon blue
  text: '#FFFFFF',              // White text
  textSecondary: '#B0B0B0',     // Gray text
  cardBackground: '#1A1A1C',    // Slightly lighter than background
  border: '#2A2A2C',            // Subtle border
  success: '#00E676',           // Same as primary
  error: '#FF5252',             // Red for errors
  warning: '#FFB74D',           // Orange for warnings
};

/**
 * Maximum ELO rating
 * Practical upper limit for the system
 */
export const MAX_ELO = 3000;

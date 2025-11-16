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

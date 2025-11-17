import { Platform } from 'react-native';

// Only import SQLite on native platforms
const SQLite = Platform.OS !== 'web' ? require('expo-sqlite') : null;

let db = null;

/**
 * Initialize and open the database
 */
export async function initDatabase() {
  // SQLite only works on native platforms (iOS/Android)
  if (Platform.OS === 'web') {
    console.log('Running on web - SQLite not supported, using AsyncStorage fallback');
    return null;
  }
  
  try {
    db = await SQLite.openDatabaseAsync('pingpong.db');
    
    // Create user_profile table for current authenticated user
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        uid TEXT NOT NULL UNIQUE,
        displayName TEXT NOT NULL,
        email TEXT NOT NULL,
        rating INTEGER NOT NULL DEFAULT 1000,
        rd INTEGER NOT NULL DEFAULT 300,
        matchesPlayed INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        lastPlayed INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0,
        lastModified INTEGER DEFAULT 0
      );
    `);
    
    // Create opponents table to cache other users
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS opponents (
        uid TEXT PRIMARY KEY,
        displayName TEXT NOT NULL,
        email TEXT NOT NULL,
        rating INTEGER NOT NULL DEFAULT 1000,
        rd INTEGER NOT NULL DEFAULT 300,
        matchesPlayed INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        lastPlayed INTEGER DEFAULT 0,
        lastFetched INTEGER DEFAULT 0
      );
    `);
    
    // LEGACY: Keep old players table for migration purposes
    // This will be removed after successful migration
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        rating INTEGER NOT NULL DEFAULT 1000,
        rd INTEGER NOT NULL DEFAULT 300,
        matchesPlayed INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        lastPlayed INTEGER DEFAULT 0,
        firestoreId TEXT UNIQUE,
        synced INTEGER DEFAULT 0,
        lastModified INTEGER DEFAULT 0
      );
    `);
    
    // Migrate existing players table - add new columns if they don't exist
    // Use a safer approach by checking the table schema first
    const tableInfo = await db.getAllAsync('PRAGMA table_info(players)');
    const columnNames = tableInfo.map(col => col.name);
    
    if (!columnNames.includes('firestoreId')) {
      await db.execAsync(`ALTER TABLE players ADD COLUMN firestoreId TEXT;`);
      console.log('Added firestoreId column to players');
    }
    
    if (!columnNames.includes('synced')) {
      await db.execAsync(`ALTER TABLE players ADD COLUMN synced INTEGER DEFAULT 0;`);
      console.log('Added synced column to players');
    }
    
    if (!columnNames.includes('lastModified')) {
      await db.execAsync(`ALTER TABLE players ADD COLUMN lastModified INTEGER DEFAULT 0;`);
      console.log('Added lastModified column to players');
    }
    
    if (!columnNames.includes('wins')) {
      await db.execAsync(`ALTER TABLE players ADD COLUMN wins INTEGER DEFAULT 0;`);
      console.log('Added wins column to players');
    }
    
    if (!columnNames.includes('losses')) {
      await db.execAsync(`ALTER TABLE players ADD COLUMN losses INTEGER DEFAULT 0;`);
      console.log('Added losses column to players');
    }
    
    if (!columnNames.includes('rd')) {
      await db.execAsync(`ALTER TABLE players ADD COLUMN rd INTEGER DEFAULT 300;`);
      console.log('Added rd column to players');
    }
    
    if (!columnNames.includes('lastPlayed')) {
      await db.execAsync(`ALTER TABLE players ADD COLUMN lastPlayed INTEGER DEFAULT 0;`);
      console.log('Added lastPlayed column to players');
    }
    
    // Create matches table with user UIDs
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userUid TEXT NOT NULL,
        opponentUid TEXT NOT NULL,
        winnerUid TEXT NOT NULL,
        date INTEGER NOT NULL,
        userRatingBefore INTEGER NOT NULL,
        userRatingAfter INTEGER NOT NULL,
        opponentRatingBefore INTEGER NOT NULL,
        opponentRatingAfter INTEGER NOT NULL,
        firestoreId TEXT UNIQUE,
        synced INTEGER DEFAULT 0,
        lastModified INTEGER DEFAULT 0
      );
    `);
    
    // Migrate existing matches table - add new columns if they don't exist
    const matchesTableInfo = await db.getAllAsync('PRAGMA table_info(matches)');
    const matchesColumns = matchesTableInfo.map(col => col.name);
    
    // Check if we need to migrate from old schema (playerA/playerB) to new schema (userUid/opponentUid)
    const hasOldSchema = matchesColumns.includes('playerA');
    const hasNewSchema = matchesColumns.includes('userUid');
    
    if (hasOldSchema && !hasNewSchema) {
      console.log('Migrating matches table to user-based schema...');
      // For now, we'll keep both schemas. In production, you'd want to migrate data
      // Add new columns
      await db.execAsync(`ALTER TABLE matches ADD COLUMN userUid TEXT;`);
      await db.execAsync(`ALTER TABLE matches ADD COLUMN opponentUid TEXT;`);
      await db.execAsync(`ALTER TABLE matches ADD COLUMN winnerUid TEXT;`);
      await db.execAsync(`ALTER TABLE matches ADD COLUMN userRatingBefore INTEGER;`);
      await db.execAsync(`ALTER TABLE matches ADD COLUMN userRatingAfter INTEGER;`);
      await db.execAsync(`ALTER TABLE matches ADD COLUMN opponentRatingBefore INTEGER;`);
      await db.execAsync(`ALTER TABLE matches ADD COLUMN opponentRatingAfter INTEGER;`);
      console.log('Added UID-based columns to matches');
    }
    
    if (!matchesColumns.includes('firestoreId')) {
      await db.execAsync(`ALTER TABLE matches ADD COLUMN firestoreId TEXT;`);
      console.log('Added firestoreId column to matches');
    }
    
    if (!matchesColumns.includes('synced')) {
      await db.execAsync(`ALTER TABLE matches ADD COLUMN synced INTEGER DEFAULT 0;`);
      console.log('Added synced column to matches');
    }
    
    if (!matchesColumns.includes('lastModified')) {
      await db.execAsync(`ALTER TABLE matches ADD COLUMN lastModified INTEGER DEFAULT 0;`);
      console.log('Added lastModified column to matches');
    }
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Get the database instance
 */
export function getDatabase() {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!db) {
    console.warn('Database not initialized yet. Call initDatabase() first.');
    return null;
  }
  return db;
}

/**
 * Close the database connection
 */
export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

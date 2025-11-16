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
    
    // Create players table with Firestore sync fields
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        rating INTEGER NOT NULL DEFAULT 1000,
        matchesPlayed INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
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
    
    // Create matches table with Firestore sync fields
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playerA INTEGER NOT NULL,
        playerB INTEGER NOT NULL,
        winner INTEGER NOT NULL,
        date INTEGER NOT NULL,
        ratingA_before INTEGER NOT NULL,
        ratingA_after INTEGER NOT NULL,
        ratingB_before INTEGER NOT NULL,
        ratingB_after INTEGER NOT NULL,
        firestoreId TEXT UNIQUE,
        synced INTEGER DEFAULT 0,
        lastModified INTEGER DEFAULT 0,
        FOREIGN KEY (playerA) REFERENCES players(id),
        FOREIGN KEY (playerB) REFERENCES players(id),
        FOREIGN KEY (winner) REFERENCES players(id)
      );
    `);
    
    // Migrate existing matches table - add new columns if they don't exist
    const matchesTableInfo = await db.getAllAsync('PRAGMA table_info(matches)');
    const matchesColumns = matchesTableInfo.map(col => col.name);
    
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

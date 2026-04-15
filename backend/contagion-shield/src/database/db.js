/**
 * Database module - Manages Turso/LibSQL connection and provides schema migration helpers.
 */
import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('database');

// Configure client for either Turso Cloud or local file fallback
let dbConfig;
if (config.tursoUrl && config.tursoAuthToken) {
  logger.info('Using Turso Cloud Database');
  dbConfig = {
    url: config.tursoUrl,
    authToken: config.tursoAuthToken
  };
} else {
  logger.warn('Turso credentials missing. Falling back to local file.');
  if (!config.dbPath) {
    logger.error('DB_PATH is missing! Please set it in your .env file.');
    process.exit(1);
  }
  
  // Ensure data directory exists
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  dbConfig = {
    url: `file:${config.dbPath}`
  };
} // Initialize libsql connection
const db = createClient(dbConfig);


/**
 * Executes database migrations to set up the schema.
 * @returns {Promise<void>}
 */
export const initDb = async () => {
  logger.info('Initializing database (LibSQL)...');
  
  try {
    // Create migrations table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        executed_at INTEGER DEFAULT (unixepoch('now') * 1000)
      )
    `);
    
    // Check if initial migration was executed
    const result = await db.execute({
      sql: 'SELECT id FROM migrations WHERE name = ?',
      args: ['001_initial']
    });
    const initialMigration = result.rows[0];
    
    if (!initialMigration) {
      logger.info('Running migration 001_initial...');
      const { up } = await import('./migrations/001_initial.js');
      
      // We can't really do DDL in a standard SQL transaction easily in some SQLite environments
      // but LibSQL supports it via batch or transaction. Let's just run them sequentially.
      await up(db);
      
      await db.execute({
        sql: 'INSERT INTO migrations (name) VALUES (?)',
        args: ['001_initial']
      });
      
      logger.info('Migration 001_initial complete.');
    } else {
      logger.debug('Database already up to date.');
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to initialize database');
    throw error;
  }
};

/**
 * Resets the database (for development use).
 */
export const resetDb = async () => {
  logger.warn('Resetting database...');
  try {
    const tables = ['liquidity_events', 'swap_events', 'price_snapshots', 'pair_snapshots', 'contract_risks', 'migrations'];
    for (const table of tables) {
      await db.execute(`DROP TABLE IF EXISTS ${table}`);
    }
    logger.info('Database reset complete.');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to reset database');
    throw error;
  }
};

export default db;

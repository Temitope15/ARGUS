/**
 * Database module - Manages SQLite connection and provides schema migration helpers.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('database');

// Ensure data directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.dbPath, {
  verbose: (msg) => logger.debug(msg)
});

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

/**
 * Executes migrations.
 */
/**
 * Executes database migrations to set up the schema.
 * @returns {Promise<void>}
 */
export const initDb = async () => {
  logger.info('Initializing database...');
  
  // Create migrations table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      executed_at INTEGER DEFAULT (unixepoch('now') * 1000)
    )
  `);
  
  // Check if initial migration was executed
  const initialMigration = db.prepare('SELECT id FROM migrations WHERE name = ?').get('001_initial');
  
  if (!initialMigration) {
    logger.info('Running migration 001_initial...');
    // We import the migration dynamically to avoid circular dependencies if any
    const { up } = await import('./migrations/001_initial.js');
    db.transaction(() => {
      up(db);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run('001_initial');
    })();
    logger.info('Migration 001_initial complete.');
  } else {
    logger.debug('Database already up to date.');
  }
};

/**
 * Resets the database (for development use).
 */
/**
 * Resets the database by closing the connection and deleting the database files.
 * @returns {void}
 */
export const resetDb = () => {
  logger.warn('Resetting database...');
  db.close();
  if (fs.existsSync(config.dbPath)) {
    fs.unlinkSync(config.dbPath);
    // Also remove WAL files if they exist
    if (fs.existsSync(`${config.dbPath}-wal`)) fs.unlinkSync(`${config.dbPath}-wal`);
    if (fs.existsSync(`${config.dbPath}-shm`)) fs.unlinkSync(`${config.dbPath}-shm`);
  }
  logger.info('Database reset complete.');
};

export default db;

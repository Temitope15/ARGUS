/**
 * Phase 2 Database Module - Manages Phase 2 table schema and queries.
 * Shares the same SQLite connection as Phase 1.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('phase2-db');

// Assuming shared DB_PATH in .env
const dbPath = process.env.DB_PATH || './data/argus.db';

// Ensure data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, {
  verbose: (msg) => logger.debug(msg)
});

// Enable WAL mode
db.pragma('journal_mode = WAL');

/**
 * Initializes Phase 2 tables and indexes.
 */
export const initPhase2Db = () => {
  logger.info('Initializing Phase 2 tables...');

  // Protocols Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS protocols (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      token_id TEXT NOT NULL,
      pair_id TEXT NOT NULL,
      chain TEXT NOT NULL,
      stablecoin_token_ids TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);

  // Scores Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      alert_level TEXT NOT NULL,
      signal_tvl_pts INTEGER DEFAULT 0,
      signal_lp_pts INTEGER DEFAULT 0,
      signal_depeg_pts INTEGER DEFAULT 0,
      signal_smart_money_pts INTEGER DEFAULT 0,
      signal_ave_risk_pts INTEGER DEFAULT 0,
      contagion_multiplier_applied INTEGER DEFAULT 0,
      low_confidence INTEGER DEFAULT 0,
      computed_at INTEGER NOT NULL
    )
  `);

  // Canary Wallets Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS canary_wallets (
      address TEXT NOT NULL,
      chain TEXT NOT NULL,
      total_profit REAL,
      total_profit_rate REAL,
      refreshed_at INTEGER NOT NULL,
      PRIMARY KEY (address, chain)
    )
  `);

  // Canary Exits Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS canary_exits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      protocol_id TEXT NOT NULL,
      token_address TEXT,
      amount_usd REAL,
      exit_type TEXT,
      occurred_at INTEGER NOT NULL
    )
  `);

  // Holder Snapshots Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS holder_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_id TEXT NOT NULL,
      holder_address TEXT NOT NULL,
      balance_ratio REAL NOT NULL,
      balance_usd REAL NOT NULL,
      rank INTEGER NOT NULL,
      snapshotted_at INTEGER NOT NULL
    )
  `);

  // Alerts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol_id TEXT NOT NULL,
      alert_level TEXT NOT NULL,
      score INTEGER NOT NULL,
      message TEXT NOT NULL,
      telegram_message_id TEXT,
      telegram_sent INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scores_protocol ON scores(protocol_id, computed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_holder_snapshots_token ON holder_snapshots(token_id, snapshotted_at DESC);
    CREATE INDEX IF NOT EXISTS idx_canary_exits_protocol ON canary_exits(protocol_id, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_protocol ON alerts(protocol_id, created_at DESC);
  `);

  logger.info('Phase 2 tables initialized.');
};

export default db;

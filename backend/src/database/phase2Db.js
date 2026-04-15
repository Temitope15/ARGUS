/**
 * Phase 2 Database Module - Manages Phase 2 table schema and queries.
 * Refactored for Turso (LibSQL) with async operations.
 */
import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('phase2-db');

let dbConfig;
if (config.tursoUrl && config.tursoAuthToken) {
  logger.info('Using Turso Cloud Database for Phase 2/3');
  dbConfig = {
    url: config.tursoUrl,
    authToken: config.tursoAuthToken
  };
} else {
  logger.warn('Turso credentials missing. Falling back to local file for Phase 2/3.');
  if (!config.dbPath) {
    throw new Error('CRITICAL: Missing required environment variable: DB_PATH');
  }
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbConfig = { url: `file:${config.dbPath}` };
}

const db = createClient(dbConfig);

/**
 * Initializes Phase 2 tables and indexes.
 */
export const initPhase2Db = async () => {
  logger.info('Initializing Phase 2 tables...');

  const statements = [
    // Protocols Table
    `CREATE TABLE IF NOT EXISTS protocols (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      token_id TEXT NOT NULL,
      pair_id TEXT NOT NULL,
      chain TEXT NOT NULL,
      stablecoin_token_ids TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    )`,

    // Scores Table
    `CREATE TABLE IF NOT EXISTS scores (
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
    )`,

    // Canary Wallets Table
    `CREATE TABLE IF NOT EXISTS canary_wallets (
      address TEXT NOT NULL,
      chain TEXT NOT NULL,
      total_profit REAL,
      total_profit_rate REAL,
      refreshed_at INTEGER NOT NULL,
      PRIMARY KEY (address, chain)
    )`,

    // Canary Exits Table
    `CREATE TABLE IF NOT EXISTS canary_exits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL,
      protocol_id TEXT NOT NULL,
      token_address TEXT,
      amount_usd REAL,
      exit_type TEXT,
      occurred_at INTEGER NOT NULL
    )`,

    // Holder Snapshots Table
    `CREATE TABLE IF NOT EXISTS holder_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_id TEXT NOT NULL,
      holder_address TEXT NOT NULL,
      balance_ratio REAL NOT NULL,
      balance_usd REAL NOT NULL,
      rank INTEGER NOT NULL,
      snapshotted_at INTEGER NOT NULL
    )`,

    // Alerts Table
    `CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol_id TEXT NOT NULL,
      alert_level TEXT NOT NULL,
      score INTEGER NOT NULL,
      message TEXT NOT NULL,
      telegram_message_id TEXT,
      telegram_sent INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )`,

    // Phase 2 Indexes
    `CREATE INDEX IF NOT EXISTS idx_scores_protocol ON scores(protocol_id, computed_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_holder_snapshots_token ON holder_snapshots(token_id, snapshotted_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_canary_exits_protocol ON canary_exits(protocol_id, occurred_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_protocol ON alerts(protocol_id, created_at DESC)`,

    // Clean up legacy tables
    `DROP TABLE IF EXISTS users`,
    `DROP TABLE IF EXISTS wallets`,
    `DROP TABLE IF EXISTS positions`,
    `DROP TABLE IF EXISTS trade_suggestions`,
    `DROP TABLE IF EXISTS funding_history`,
    `DROP TABLE IF EXISTS portfolio_snapshots`,
    `DROP TABLE IF EXISTS user_sessions`,

    // Subscribers Table
    `CREATE TABLE IF NOT EXISTS subscribers (
      chat_id TEXT PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      subscribed_at INTEGER NOT NULL,
      last_active_at INTEGER
    )`
  ];

  try {
    for (const stmt of statements) {
      await db.execute(stmt);
    }
    logger.info('Phase 2 + Subscriptions tables initialized.');
  } catch (error) {
    logger.error('Failed to initialize phase 2 tables', error);
  }
};

// ============================================
// Database Helpers
// ============================================

export const upsertSubscriber = async (data, client = db) => {
  await client.execute({
    sql: `INSERT INTO subscribers (chat_id, username, first_name, subscribed_at, last_active_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(chat_id) DO UPDATE SET 
            username=excluded.username, 
            first_name=excluded.first_name, 
            last_active_at=excluded.last_active_at`,
    args: [data.chat_id, data.username, data.first_name, data.subscribed_at, data.subscribed_at]
  });
};

export const removeSubscriber = async (chat_id, client = db) => {
  await client.execute({ sql: 'DELETE FROM subscribers WHERE chat_id = ?', args: [chat_id] });
};

export const getAllSubscribers = async (client = db) => {
  return (await client.execute('SELECT * FROM subscribers')).rows;
};

export const countSubscribers = async (client = db) => {
  const result = await client.execute('SELECT COUNT(*) as count FROM subscribers');
  return result.rows[0].count;
};

export const getLatestScore = async (protocolId, client = db) => {
  return (await client.execute({ sql: 'SELECT * FROM scores WHERE protocol_id = ? ORDER BY computed_at DESC LIMIT 1', args: [protocolId] })).rows[0];
};

export const getAllLatestScores = async (client = db) => {
  return (await client.execute(`
    SELECT s1.* FROM scores s1
    INNER JOIN (SELECT protocol_id, MAX(computed_at) as max_at FROM scores GROUP BY protocol_id) s2
    ON s1.protocol_id = s2.protocol_id AND s1.computed_at = s2.max_at
  `)).rows;
};

export const isCanaryWallet = async (address, chain, client = db) => {
  return (await client.execute({ sql: 'SELECT address FROM canary_wallets WHERE address = ? AND chain = ?', args: [address, chain] })).rows[0];
};

export const countAlertsToday = async (client = db) => {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0,0,0,0);
  const ts = Math.floor(startOfDay.getTime() / 1000);
  const result = await client.execute({ sql: 'SELECT COUNT(*) as count FROM alerts WHERE created_at >= ?', args: [ts] });
  return result.rows[0].count;
};

export const countWhaleMovesToday = async (client = db) => {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0,0,0,0);
  const ts = Math.floor(startOfDay.getTime() / 1000);
  const result = await client.execute({ sql: 'SELECT COUNT(*) as count FROM canary_exits WHERE occurred_at >= ?', args: [ts] });
  return result.rows[0].count;
};

export const getStats = async (client = db) => {
  const alertsCount = await countAlertsToday(client);
  const whaleCount = await countWhaleMovesToday(client);
  const subCount = await countSubscribers(client);
  return { alertsCount, whaleCount, subCount };
};

// Transaction wrapper helper for backwards compatibility / async ease
// Will create a libSQL transaction and pass it down.
export const runTransaction = async (asyncFn) => {
  const tx = await db.transaction('write');
  try {
    const result = await asyncFn(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

export default db;

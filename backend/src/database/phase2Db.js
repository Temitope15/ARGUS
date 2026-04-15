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

    // Users
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      telegram_username TEXT,
      telegram_first_name TEXT NOT NULL,
      telegram_last_name TEXT,
      telegram_photo_url TEXT,
      jwt_secret TEXT NOT NULL,
      auto_trade_enabled INTEGER DEFAULT 0,
      auto_trade_max_pct REAL DEFAULT 2.0,
      risk_tolerance TEXT DEFAULT 'moderate',
      created_at INTEGER NOT NULL,
      last_login_at INTEGER NOT NULL
    )`,

    // Virtual wallets
    `CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      asset TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      balance_usd REAL NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      UNIQUE(user_id, asset)
    )`,

    // Wallet funding history
    `CREATE TABLE IF NOT EXISTS funding_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      asset TEXT NOT NULL,
      amount REAL NOT NULL,
      amount_usd REAL NOT NULL,
      price_at_funding REAL NOT NULL,
      funded_at INTEGER NOT NULL
    )`,

    // Paper trade positions
    `CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      protocol_id TEXT NOT NULL,
      protocol_name TEXT NOT NULL,
      token_id TEXT NOT NULL,
      pair_id TEXT NOT NULL,
      chain TEXT NOT NULL,
      from_asset TEXT NOT NULL,
      from_amount REAL NOT NULL,
      from_amount_usd REAL NOT NULL,
      to_asset TEXT NOT NULL,
      to_amount REAL NOT NULL,
      entry_price_usd REAL NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_description TEXT,
      agent_suggested INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      current_price_usd REAL,
      pnl_usd REAL DEFAULT 0,
      pnl_pct REAL DEFAULT 0,
      close_price_usd REAL,
      close_reason TEXT,
      closed_at INTEGER,
      opened_at INTEGER NOT NULL
    )`,

    // Trade suggestions
    `CREATE TABLE IF NOT EXISTS trade_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      protocol_id TEXT NOT NULL,
      protocol_name TEXT NOT NULL,
      token_id TEXT NOT NULL,
      pair_id TEXT NOT NULL,
      chain TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_description TEXT NOT NULL,
      whale_amount_usd REAL,
      whale_wallet TEXT,
      suggested_from_asset TEXT NOT NULL,
      suggested_amount REAL NOT NULL,
      suggested_amount_asset REAL NOT NULL,
      suggested_pct_of_balance REAL NOT NULL,
      agent_reasoning TEXT NOT NULL,
      telegram_message_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      responded_at INTEGER,
      position_id INTEGER REFERENCES positions(id),
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`,

    // Portfolio P&L snapshots
    `CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      total_value_usd REAL NOT NULL,
      total_pnl_usd REAL NOT NULL,
      total_pnl_pct REAL NOT NULL,
      snapshotted_at INTEGER NOT NULL
    )`,

    // User session state
    `CREATE TABLE IF NOT EXISTS user_sessions (
      telegram_id TEXT PRIMARY KEY,
      awaiting TEXT,
      suggestion_id INTEGER,
      updated_at INTEGER NOT NULL
    )`,

    // Phase 3 Indexes
    `CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_suggestions_user ON trade_suggestions(user_id, status)`,
    `CREATE INDEX IF NOT EXISTS idx_snapshots_user ON portfolio_snapshots(user_id, snapshotted_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_funding_user ON funding_history(user_id, funded_at DESC)`
  ];

  try {
    for (const stmt of statements) {
      await db.execute(stmt);
    }
    logger.info('Phase 2 + Phase 3 tables initialized.');
  } catch (error) {
    logger.error('Failed to initialize phase 2 tables', error);
  }
};

// ============================================
// Phase 3 Query Helpers
// Notice: We add an optional `client` parameter defaulting to `db`
// to allow passing a transaction object if needed.
// ============================================

// --- Users ---
export const getUserByTelegramId = async (telegramId, client = db) => {
  const res = await client.execute({ sql: 'SELECT * FROM users WHERE telegram_id = ?', args: [telegramId] });
  return res.rows[0];
};

export const getUserById = async (id, client = db) => {
  const res = await client.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
  return res.rows[0];
};

export const createUser = async (data, client = db) => {
  const res = await client.execute({
    sql: `INSERT INTO users (telegram_id, telegram_username, telegram_first_name, telegram_last_name, telegram_photo_url, jwt_secret, created_at, last_login_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    args: [data.telegram_id, data.telegram_username, data.telegram_first_name, data.telegram_last_name, data.telegram_photo_url, data.jwt_secret, Date.now(), Date.now()]
  });
  return res.rows[0]?.id; // or lastInsertRowid if available, but RETURNING is safer
};

export const updateUserLogin = async (telegramId, data, client = db) => {
  await client.execute({
    sql: `UPDATE users SET telegram_username = ?, telegram_first_name = ?, telegram_last_name = ?, telegram_photo_url = ?, last_login_at = ?
          WHERE telegram_id = ?`,
    args: [data.telegram_username, data.telegram_first_name, data.telegram_last_name, data.telegram_photo_url, Date.now(), telegramId]
  });
};

export const updateUserSettings = async (userId, settings, client = db) => {
  const fields = [];
  const values = [];
  if (settings.risk_tolerance !== undefined) { fields.push('risk_tolerance = ?'); values.push(settings.risk_tolerance); }
  if (settings.auto_trade_enabled !== undefined) { fields.push('auto_trade_enabled = ?'); values.push(settings.auto_trade_enabled ? 1 : 0); }
  if (settings.auto_trade_max_pct !== undefined) { fields.push('auto_trade_max_pct = ?'); values.push(settings.auto_trade_max_pct); }
  if (fields.length === 0) return;
  values.push(userId);
  await client.execute({
    sql: `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    args: values
  });
};

export const getUsersWithTelegram = async (client = db) => {
  return (await client.execute('SELECT * FROM users')).rows;
};

// --- Wallets ---
export const getWallets = async (userId, client = db) => {
  return (await client.execute({ sql: 'SELECT * FROM wallets WHERE user_id = ?', args: [userId] })).rows;
};

export const getWallet = async (userId, asset, client = db) => {
  return (await client.execute({ sql: 'SELECT * FROM wallets WHERE user_id = ? AND asset = ?', args: [userId, asset] })).rows[0];
};

export const upsertWallet = async (userId, asset, addAmount, addAmountUsd, client = db) => {
  const existing = await getWallet(userId, asset, client);
  if (existing) {
    await client.execute({
      sql: `UPDATE wallets SET balance = balance + ?, balance_usd = balance_usd + ?, updated_at = ? WHERE user_id = ? AND asset = ?`,
      args: [addAmount, addAmountUsd, Date.now(), userId, asset]
    });
  } else {
    await client.execute({
      sql: `INSERT INTO wallets (user_id, asset, balance, balance_usd, updated_at) VALUES (?, ?, ?, ?, ?)`,
      args: [userId, asset, addAmount, addAmountUsd, Date.now()]
    });
  }
  return await getWallet(userId, asset, client);
};

export const updateWallet = async (userId, asset, data, client = db) => {
  await client.execute({
    sql: `UPDATE wallets SET balance = ?, balance_usd = ?, updated_at = ? WHERE user_id = ? AND asset = ?`,
    args: [data.balance, data.balance_usd, Date.now(), userId, asset]
  });
};

// --- Funding History ---
export const logFunding = async (userId, asset, amount, amountUsd, priceAtFunding, client = db) => {
  await client.execute({
    sql: `INSERT INTO funding_history (user_id, asset, amount, amount_usd, price_at_funding, funded_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [userId, asset, amount, amountUsd, priceAtFunding, Date.now()]
  });
};

export const getFundingHistory = async (userId, client = db) => {
  return (await client.execute({ sql: 'SELECT * FROM funding_history WHERE user_id = ? ORDER BY funded_at DESC', args: [userId] })).rows;
};

// --- Positions ---
export const createPosition = async (data, client = db) => {
  const res = await client.execute({
    sql: `INSERT INTO positions (
            user_id, protocol_id, protocol_name, token_id, pair_id, chain,
            from_asset, from_amount, from_amount_usd, to_asset, to_amount, entry_price_usd,
            trigger_type, trigger_description, agent_suggested, status, opened_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?) RETURNING id`,
    args: [
      data.user_id, data.protocol_id, data.protocol_name, data.token_id, data.pair_id, data.chain,
      data.from_asset, data.from_amount, data.from_amount_usd, data.to_asset, data.to_amount, data.entry_price_usd,
      data.trigger_type, data.trigger_description, data.agent_suggested ? 1 : 0, data.opened_at || Math.floor(Date.now() / 1000)
    ]
  });
  return res.rows[0]?.id;
};

export const getPositions = async (userId, status, client = db) => {
  if (status) {
    return (await client.execute({ sql: 'SELECT * FROM positions WHERE user_id = ? AND status = ? ORDER BY opened_at DESC', args: [userId, status] })).rows;
  }
  return (await client.execute({ sql: 'SELECT * FROM positions WHERE user_id = ? ORDER BY opened_at DESC', args: [userId] })).rows;
};

export const getPosition = async (positionId, client = db) => {
  return (await client.execute({ sql: 'SELECT * FROM positions WHERE id = ?', args: [positionId] })).rows[0];
};

export const getAllOpenPositions = async (client = db) => {
  return (await client.execute({ sql: 'SELECT * FROM positions WHERE status = ?', args: ['open'] })).rows;
};

export const updatePosition = async (positionId, data, client = db) => {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(positionId);
  await client.execute({ sql: `UPDATE positions SET ${fields.join(', ')} WHERE id = ?`, args: values });
};

export const closePosition = async (positionId, closePrice, reason, client = db) => {
  const position = await getPosition(positionId, client);
  if (!position || position.status !== 'open') return null;
  const pnlUsd = (closePrice - position.entry_price_usd) * position.to_amount;
  const pnlPct = (closePrice / position.entry_price_usd - 1) * 100;
  await client.execute({
    sql: `UPDATE positions SET status = 'closed', close_price_usd = ?, close_reason = ?, closed_at = ?,
          current_price_usd = ?, pnl_usd = ?, pnl_pct = ? WHERE id = ?`,
    args: [closePrice, reason, Math.floor(Date.now() / 1000), closePrice, pnlUsd, pnlPct, positionId]
  });
  return { ...position, status: 'closed', close_price_usd: closePrice, pnl_usd: pnlUsd, pnl_pct: pnlPct };
};

// --- Trade Suggestions ---
export const createSuggestion = async (data, client = db) => {
  const res = await client.execute({
    sql: `INSERT INTO trade_suggestions (
            user_id, protocol_id, protocol_name, token_id, pair_id, chain,
            trigger_type, trigger_description, whale_amount_usd, whale_wallet,
            suggested_from_asset, suggested_amount, suggested_amount_asset, suggested_pct_of_balance,
            agent_reasoning, status, created_at, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?) RETURNING id`,
    args: [
      data.user_id, data.protocol_id, data.protocol_name, data.token_id, data.pair_id, data.chain,
      data.trigger_type, data.trigger_description, data.whale_amount_usd, data.whale_wallet,
      data.suggested_from_asset, data.suggested_amount, data.suggested_amount_asset, data.suggested_pct_of_balance,
      data.agent_reasoning, data.created_at || Math.floor(Date.now() / 1000), data.expires_at
    ]
  });
  return res.rows[0]?.id;
};

export const getSuggestion = async (id, client = db) => {
  return (await client.execute({ sql: 'SELECT * FROM trade_suggestions WHERE id = ?', args: [id] })).rows[0];
};

export const getPendingSuggestions = async (userId, client = db) => {
  return (await client.execute({ sql: 'SELECT * FROM trade_suggestions WHERE user_id = ? AND status = ? ORDER BY created_at DESC', args: [userId, 'pending'] })).rows;
};

export const updateSuggestion = async (id, data, client = db) => {
  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(id);
  await client.execute({ sql: `UPDATE trade_suggestions SET ${fields.join(', ')} WHERE id = ?`, args: values });
};

export const hasRecentSuggestion = async (userId, protocolId, withinMs = 3600000, client = db) => {
  const since = Math.floor((Date.now() - withinMs) / 1000);
  const row = (await client.execute({
    sql: 'SELECT id FROM trade_suggestions WHERE user_id = ? AND protocol_id = ? AND created_at > ?',
    args: [userId, protocolId, since]
  })).rows[0];
  return !!row;
};

// --- Portfolio Snapshots ---
export const savePortfolioSnapshot = async (userId, totalValueUsd, totalPnlUsd, totalPnlPct, client = db) => {
  await client.execute({
    sql: `INSERT INTO portfolio_snapshots (user_id, total_value_usd, total_pnl_usd, total_pnl_pct, snapshotted_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [userId, totalValueUsd, totalPnlUsd, totalPnlPct, Math.floor(Date.now() / 1000)]
  });
};

export const getPortfolioSnapshots = async (userId, limit = 100, client = db) => {
  return (await client.execute({
    sql: 'SELECT * FROM portfolio_snapshots WHERE user_id = ? ORDER BY snapshotted_at DESC LIMIT ?',
    args: [userId, limit]
  })).rows;
};

// --- User Sessions ---
export const getUserSession = async (telegramId, client = db) => {
  return (await client.execute({ sql: 'SELECT * FROM user_sessions WHERE telegram_id = ?', args: [String(telegramId)] })).rows[0];
};

export const setUserSession = async (telegramId, awaiting, suggestionId, client = db) => {
  await client.execute({
    sql: `INSERT INTO user_sessions (telegram_id, awaiting, suggestion_id, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(telegram_id) DO UPDATE SET awaiting=excluded.awaiting, suggestion_id=excluded.suggestion_id, updated_at=excluded.updated_at`,
    args: [String(telegramId), awaiting, suggestionId, Date.now()]
  });
};

export const clearUserSession = async (telegramId, client = db) => {
  await client.execute({ sql: 'DELETE FROM user_sessions WHERE telegram_id = ?', args: [String(telegramId)] });
};

// --- Utility ---
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

export const getUserPortfolioValue = async (userId, client = db) => {
  const wallets = await getWallets(userId, client);
  const openPositions = await getPositions(userId, 'open', client);
  const walletValue = wallets.reduce((sum, w) => sum + w.balance_usd, 0);
  const positionPnl = openPositions.reduce((sum, p) => sum + (p.pnl_usd || 0), 0);
  const totalPnlPct = walletValue > 0 ? (positionPnl / walletValue) * 100 : 0;
  return { totalValueUsd: walletValue + positionPnl, totalPnlUsd: positionPnl, totalPnlPct };
};

export const getUsersWithPositions = async (client = db) => {
  return (await client.execute({ sql: 'SELECT DISTINCT u.* FROM users u JOIN positions p ON u.id = p.user_id WHERE p.status = ?', args: ['open'] })).rows;
};

// Reset demo data for a user
export const resetUserData = async (userId, client = db) => {
  await client.execute({ sql: 'DELETE FROM positions WHERE user_id = ?', args: [userId] });
  await client.execute({ sql: 'DELETE FROM wallets WHERE user_id = ?', args: [userId] });
  await client.execute({ sql: 'DELETE FROM funding_history WHERE user_id = ?', args: [userId] });
  await client.execute({ sql: 'DELETE FROM trade_suggestions WHERE user_id = ?', args: [userId] });
  await client.execute({ sql: 'DELETE FROM portfolio_snapshots WHERE user_id = ?', args: [userId] });
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

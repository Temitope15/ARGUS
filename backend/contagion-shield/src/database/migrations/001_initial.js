/**
 * Initial migration - Creates all tables and indexes.
 * Updated for LibSQL format.
 */

export const up = async (db) => {
  const statements = [
    // Liquidity Events
    `CREATE TABLE liquidity_events (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      chain TEXT NOT NULL,
      protocol TEXT,
      pair_address TEXT NOT NULL,
      token_in TEXT,
      token_out TEXT,
      amount_usd REAL,
      event_type TEXT NOT NULL,
      wallet_address TEXT,
      tx_hash TEXT,
      block_number INTEGER,
      raw_data TEXT,
      created_at INTEGER DEFAULT (unixepoch('now') * 1000)
    )`,
    `CREATE INDEX idx_liq_events_chain_pair ON liquidity_events(chain, pair_address)`,
    `CREATE INDEX idx_liq_events_timestamp ON liquidity_events(timestamp)`,
    `CREATE INDEX idx_liq_events_type ON liquidity_events(event_type)`,

    // Swap Events
    `CREATE TABLE swap_events (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      chain TEXT NOT NULL,
      pair_address TEXT NOT NULL,
      wallet_address TEXT,
      from_token TEXT,
      to_token TEXT,
      from_amount_usd REAL,
      to_amount_usd REAL,
      is_sell INTEGER,
      pair_liquidity_usd REAL,
      tx_hash TEXT,
      block_number INTEGER,
      raw_data TEXT,
      created_at INTEGER DEFAULT (unixepoch('now') * 1000)
    )`,
    `CREATE INDEX idx_swap_events_pair ON swap_events(pair_address)`,
    `CREATE INDEX idx_swap_events_timestamp ON swap_events(timestamp)`,

    // Price Snapshots
    `CREATE TABLE price_snapshots (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      chain TEXT NOT NULL,
      token_address TEXT NOT NULL,
      symbol TEXT,
      price_usd REAL,
      tvl REAL,
      price_change_1h REAL,
      price_change_24h REAL,
      volume_u_24h REAL,
      source TEXT,
      created_at INTEGER DEFAULT (unixepoch('now') * 1000)
    )`,
    `CREATE INDEX idx_price_snapshots_token ON price_snapshots(chain, token_address)`,
    `CREATE INDEX idx_price_snapshots_timestamp ON price_snapshots(timestamp)`,

    // Pair Snapshots
    `CREATE TABLE pair_snapshots (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      chain TEXT NOT NULL,
      pair_address TEXT NOT NULL,
      token0_symbol TEXT,
      token1_symbol TEXT,
      reserve0 REAL,
      reserve1 REAL,
      tvl REAL,
      price_change_1h REAL,
      price_change_4h REAL,
      price_change_24h REAL,
      volume_u_1h REAL,
      volume_u_4h REAL,
      buy_volume_u_1h REAL,
      sell_volume_u_1h REAL,
      sell_buy_ratio_1h REAL,
      buys_count_4h INTEGER,
      sells_count_4h INTEGER,
      source TEXT,
      created_at INTEGER DEFAULT (unixepoch('now') * 1000)
    )`,
    `CREATE INDEX idx_pair_snapshots_pair ON pair_snapshots(chain, pair_address)`,
    `CREATE INDEX idx_pair_snapshots_timestamp ON pair_snapshots(timestamp)`,

    // Contract Risks
    `CREATE TABLE contract_risks (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      chain TEXT NOT NULL,
      token_address TEXT NOT NULL,
      analysis_risk_score REAL,
      holders INTEGER,
      lock_percent REAL,
      source TEXT,
      created_at INTEGER DEFAULT (unixepoch('now') * 1000)
    )`,
    `CREATE INDEX idx_contract_risks_token ON contract_risks(chain, token_address)`
  ];

  for (const stmt of statements) {
    await db.execute(stmt);
  }
};

export const down = async (db) => {
  const tables = ['liquidity_events', 'swap_events', 'price_snapshots', 'pair_snapshots', 'contract_risks'];
  for (const table of tables) {
    await db.execute(`DROP TABLE IF EXISTS ${table}`);
  }
};

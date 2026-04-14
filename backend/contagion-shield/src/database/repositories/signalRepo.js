/**
 * Signal Repository - General read/write for various signals.
 */
import db from '../db.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('signal-repo');

export const signalRepo = {
  /**
   * Price/TVL history queries
   */
  /**
   * Retrieves historical price snapshots for a specific token.
   * @param {string} chain - The blockchain name.
   * @param {string} tokenAddress - The token address.
   * @param {number} [limit=60] - Number of snapshots to return.
   * @returns {Array<Object>} Array of PriceSnapshot objects.
   */
  getPriceHistory: (chain, tokenAddress, limit = 60) => {
    return db.prepare(`
      SELECT * FROM price_snapshots 
      WHERE chain = ? AND token_address = ? 
      ORDER BY timestamp DESC LIMIT ?
    `).all(chain, tokenAddress, limit);
  },

  /**
   * Get first price snapshot in a time window
   */
  /**
   * Retrieves the earliest price snapshot in a given time window (for baseline comparison).
   * @param {string} chain - The blockchain name.
   * @param {string} tokenAddress - The token address.
   * @param {number} windowMs - Time window in milliseconds.
   * @returns {Object|undefined} The baseline PriceSnapshot or undefined.
   */
  getBaselinePrice: (chain, tokenAddress, windowMs) => {
    const since = Date.now() - windowMs;
    return db.prepare(`
      SELECT * FROM price_snapshots 
      WHERE chain = ? AND token_address = ? AND timestamp >= ? 
      ORDER BY timestamp ASC LIMIT 1
    `).get(chain, tokenAddress, since);
  },

  /**
   * Latest contract risk
   */
  /**
   * Retrieves the most recent contract risk assessment.
   * @param {string} chain - The blockchain name.
   * @param {string} tokenAddress - The token address.
   * @returns {Object|undefined} Lateast ContractRisk object.
   */
  getLatestContractRisk: (chain, tokenAddress) => {
    return db.prepare(`
      SELECT * FROM contract_risks 
      WHERE chain = ? AND token_address = ? 
      ORDER BY timestamp DESC LIMIT 1
    `).get(chain, tokenAddress);
  },

  /**
   * Health counts
   */
  /**
   * Returns counts of different types of signals in the database.
   * @returns {Object} Counts of liquidity, swaps, prices, and pairs.
   */
  getSignalCounts: () => {
    return {
      liquidity: db.prepare('SELECT COUNT(*) as count FROM liquidity_events').get().count,
      swaps: db.prepare('SELECT COUNT(*) as count FROM swap_events').get().count,
      prices: db.prepare('SELECT COUNT(*) as count FROM price_snapshots').get().count,
      pairs: db.prepare('SELECT COUNT(*) as count FROM pair_snapshots').get().count,
    };
  }
};

export default signalRepo;

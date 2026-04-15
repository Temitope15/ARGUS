/**
 * Signal Repository - General read/write for various signals.
 * Refactored for Turso (LibSQL, async).
 */
import db from '../db.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('signal-repo');

export const signalRepo = {
  /**
   * Retrieves historical price snapshots for a specific token.
   * @param {string} chain - The blockchain name.
   * @param {string} tokenAddress - The token address.
   * @param {number} [limit=60] - Number of snapshots to return.
   * @returns {Promise<Array<Object>>} Array of PriceSnapshot objects.
   */
  getPriceHistory: async (chain, tokenAddress, limit = 60) => {
    try {
      const result = await db.execute({
        sql: `SELECT * FROM price_snapshots 
              WHERE chain = ? AND token_address = ? 
              ORDER BY timestamp DESC LIMIT ?`,
        args: [chain, tokenAddress, limit]
      });
      return result.rows;
    } catch (error) {
      logger.error({ error: error.message, chain, tokenAddress }, 'Failed to get price history');
      return [];
    }
  },

  /**
   * Retrieves the earliest price snapshot in a given time window (for baseline comparison).
   * @param {string} chain - The blockchain name.
   * @param {string} tokenAddress - The token address.
   * @param {number} windowMs - Time window in milliseconds.
   * @returns {Promise<Object|undefined>} The baseline PriceSnapshot or undefined.
   */
  getBaselinePrice: async (chain, tokenAddress, windowMs) => {
    try {
      const since = Date.now() - windowMs;
      const result = await db.execute({
        sql: `SELECT * FROM price_snapshots 
              WHERE chain = ? AND token_address = ? AND timestamp >= ? 
              ORDER BY timestamp ASC LIMIT 1`,
        args: [chain, tokenAddress, since]
      });
      return result.rows[0];
    } catch (error) {
      logger.error({ error: error.message, chain, tokenAddress }, 'Failed to get baseline price');
      return undefined;
    }
  },

  /**
   * Retrieves the most recent contract risk assessment.
   * @param {string} chain - The blockchain name.
   * @param {string} tokenAddress - The token address.
   * @returns {Promise<Object|undefined>} Latest ContractRisk object.
   */
  getLatestContractRisk: async (chain, tokenAddress) => {
    try {
      const result = await db.execute({
        sql: `SELECT * FROM contract_risks 
              WHERE chain = ? AND token_address = ? 
              ORDER BY timestamp DESC LIMIT 1`,
        args: [chain, tokenAddress]
      });
      return result.rows[0];
    } catch (error) {
      logger.error({ error: error.message, chain, tokenAddress }, 'Failed to get latest contract risk');
      return undefined;
    }
  },

  /**
   * Returns counts of different types of signals in the database.
   * @returns {Promise<Object>} Counts of liquidity, swaps, prices, and pairs.
   */
  getSignalCounts: async () => {
    try {
      const [liq, swaps, prices, pairs] = await db.batch([
        'SELECT count(*) as count FROM liquidity_events',
        'SELECT count(*) as count FROM swap_events',
        'SELECT count(*) as count FROM price_snapshots',
        'SELECT count(*) as count FROM pair_snapshots'
      ], 'read');
      
      return {
        liquidity: liq.rows[0].count,
        swaps: swaps.rows[0].count,
        prices: prices.rows[0].count,
        pairs: pairs.rows[0].count
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get signal counts');
      return { liquidity: 0, swaps: 0, prices: 0, pairs: 0 };
    }
  }
};

export default signalRepo;

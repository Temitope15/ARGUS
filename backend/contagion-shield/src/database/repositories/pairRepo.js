/**
 * Pair Repository - Persistence and queries for pair health snapshots.
 */
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const pairRepo = {
  /**
   * Persists a pair health snapshot.
   * @param {Object} snapshot - The normalized PairSnapshot object.
   * @returns {Object} Database run result.
   */
  savePairSnapshot: (snapshot) => {
    const stmt = db.prepare(`
      INSERT INTO pair_snapshots (
        id, timestamp, chain, pair_address, token0_symbol, token1_symbol,
        reserve0, reserve1, tvl, price_change_1h, price_change_4h,
        price_change_24h, volume_u_1h, volume_u_4h, buy_volume_u_1h,
        sell_volume_u_1h, sell_buy_ratio_1h, buys_count_4h, sells_count_4h, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      snapshot.id || uuidv4(),
      snapshot.timestamp,
      snapshot.chain,
      snapshot.pairAddress,
      snapshot.token0Symbol,
      snapshot.token1Symbol,
      snapshot.reserve0,
      snapshot.reserve1,
      snapshot.tvl,
      snapshot.priceChange1h,
      snapshot.priceChange4h,
      snapshot.priceChange24h,
      snapshot.volumeU1h,
      snapshot.volumeU4h,
      snapshot.buyVolumeU1h,
      snapshot.sellVolumeU1h,
      snapshot.sellBuyRatio1h,
      snapshot.buysCount4h,
      snapshot.sellsCount4h,
      snapshot.source
    );
  },

  /**
   * Retrieves the most recent health snapshot for a specific pair.
   * @param {string} chain - The blockchain name.
   * @param {string} pairAddress - The pair contract address.
   * @returns {Object|undefined} The latest PairSnapshot or undefined.
   */
  getLatestPairSnapshot: (chain, pairAddress) => {
    return db.prepare(`
      SELECT * FROM pair_snapshots 
      WHERE chain = ? AND pair_address = ? 
      ORDER BY timestamp DESC LIMIT 1
    `).get(chain, pairAddress);
  }
};

export default pairRepo;

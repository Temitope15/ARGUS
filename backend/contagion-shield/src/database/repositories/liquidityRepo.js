/**
 * Liquidity Repository - Persistence and queries for liquidity events.
 */
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const liquidityRepo = {
  /**
   * Persists a normalized liquidity event to the database.
   * @param {Object} event - The normalized LiquidityEvent object.
   * @returns {Object} Database run result.
   */
  saveLiquidityEvent: async (event) => {
    return await db.execute({
      sql: `INSERT INTO liquidity_events (
        id, timestamp, chain, protocol, pair_address,
        token_in, token_out, amount_usd, event_type,
        wallet_address, tx_hash, block_number, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        event.id || uuidv4(),
        event.timestamp,
        event.chain,
        event.protocol,
        event.pairAddress,
        event.tokenIn,
        event.tokenOut,
        event.amountUsd,
        event.eventType,
        event.walletAddress,
        event.txHash,
        event.blockNumber,
        event.rawData
      ]
    });
  },

  /**
   * Calculates liquidity drain statistics for a specific pair over a time window.
   * @param {string} chain - The blockchain name.
   * @param {string} pairAddress - The pair contract address.
   * @param {number} windowMs - The time window in milliseconds.
   * @returns {Object} Statistics including counts, volume, and drain ratio.
   */
  getLiquidityDrainStats: async (chain, pairAddress, windowMs) => {
    const since = Date.now() - windowMs;
    
    const res = await db.execute({
      sql: `SELECT * FROM liquidity_events 
            WHERE chain = ? AND pair_address = ? AND timestamp >= ?`,
      args: [chain, pairAddress, since]
    });
    const events = res.rows;

    const removeLiquidity = events.filter(e => e.event_type === 'removeLiquidity');
    const addLiquidity = events.filter(e => e.event_type === 'addLiquidity');

    const removeLiquidityVolume = removeLiquidity.reduce((sum, e) => sum + (e.amount_usd || 0), 0);
    const addLiquidityVolume = addLiquidity.reduce((sum, e) => sum + (e.amount_usd || 0), 0);

    return {
      pair: pairAddress,
      chain,
      removeLiquidityCount: removeLiquidity.length,
      removeLiquidityVolume,
      addLiquidityCount: addLiquidity.length,
      addLiquidityVolume,
      drainRatio: addLiquidityVolume === 0 ? (removeLiquidityVolume > 0 ? 999 : 0) : removeLiquidityVolume / addLiquidityVolume,
      events
    };
  }
};

export default liquidityRepo;

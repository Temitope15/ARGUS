/**
 * Swap Repository - Persistence and queries for swap events.
 */
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const swapRepo = {
  /**
   * Persists a normalized swap event.
   * @param {Object} event - The normalized SwapEvent object.
   * @returns {Object} Database run result.
   */
  saveSwapEvent: async (event) => {
    return await db.execute({
      sql: `INSERT INTO swap_events (
        id, timestamp, chain, pair_address, wallet_address,
        from_token, to_token, from_amount_usd, to_amount_usd,
        is_sell, pair_liquidity_usd, tx_hash, block_number, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        event.id || uuidv4(),
        event.timestamp,
        event.chain,
        event.pairAddress,
        event.walletAddress,
        event.fromToken,
        event.toToken,
        event.fromAmountUsd,
        event.toAmountUsd,
        event.isSell ? 1 : 0,
        event.pairLiquidityUsd,
        event.txHash,
        event.blockNumber,
        event.rawData
      ]
    });
  },

  /**
   * Calculates sell pressure statistics for a pair over a window.
   * @param {string} chain - The blockchain name.
   * @param {string} pairAddress - The pair contract address.
   * @param {number} windowMs - Time window in milliseconds.
   * @returns {Object} Statistics including volumes, ratio, and swap details.
   */
  getSellPressureStats: async (chain, pairAddress, windowMs) => {
    const since = Date.now() - windowMs;
    
    const res = await db.execute({
      sql: `SELECT * FROM swap_events 
            WHERE chain = ? AND pair_address = ? AND timestamp >= ?`,
      args: [chain, pairAddress, since]
    });
    const swaps = res.rows;

    const sells = swaps.filter(s => s.is_sell === 1);
    const buys = swaps.filter(s => s.is_sell === 0);

    const totalSellVolume = sells.reduce((sum, s) => sum + (s.to_amount_usd || (s.from_amount_usd || 0)), 0);
    const totalBuyVolume = buys.reduce((sum, s) => sum + (s.to_amount_usd || (s.from_amount_usd || 0)), 0);

    const largestSell = sells.length > 0 ? Math.max(...sells.map(s => s.from_amount_usd || 0)) : 0;

    return {
      totalSellVolume,
      totalBuyVolume,
      sellBuyRatio: totalBuyVolume === 0 ? (totalSellVolume > 0 ? 999 : 0) : totalSellVolume / totalBuyVolume,
      swapCount: swaps.length,
      largestSellUsd: largestSell,
      swaps
    };
  }
};

export default swapRepo;

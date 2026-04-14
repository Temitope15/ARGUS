/**
 * Signal 1: TVL Velocity - Measures the rate of TVL drop.
 */
import phase1Client from '../../api/phase1Client.js';
import { interpolateScore } from '../utils/interpolate.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('signal/tvl-velocity');

/**
 * Computes the TVL Velocity score points.
 * @param {string} chain - Blockchain name.
 * @param {string} tokenAddress - Token address.
 * @returns {Promise<Object>} Object with pts, changePct, and confidence status.
 */
export async function computeTvlVelocity(chain, tokenAddress) {
  try {
    const history = await phase1Client.getTvlHistory(chain, tokenAddress, 90);
    
    if (!history || history.length === 0) {
      return { pts: 0, changePct: 0, currentTvl: 0, priceChange1h: 0, skipped: true, reason: 'No history' };
    }

    const currentTvl = history[0].tvl || 0;
    const priceChange1h = history[0]?.price_change_1h || 0;

    if (history.length < 2) {
      return { pts: 0, changePct: 0, currentTvl, priceChange1h, skipped: true, reason: 'Insufficient history' };
    }

    // Find snapshot from approx 60m ago
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Sort by proximity to oneHourAgo (assuming desc order from API)
    const snapshot1h = history.find(s => s.timestamp <= oneHourAgo) || history[history.length - 1];
    const oldTvl = snapshot1h ? snapshot1h.tvl : history[history.length - 1].tvl;

    if (oldTvl <= 0) return { pts: 0, changePct: 0, skipped: true };

    const tvlChangePct = ((currentTvl - oldTvl) / oldTvl) * 100;
    
    let pts = 0;
    if (tvlChangePct < 0) {
      const absDrop = Math.abs(tvlChangePct);
      // Drop of 5% = 10pts, drop of 15% or more = 25pts
      pts = interpolateScore(absDrop, 5, 15, 10, 25);
    }

    return { 
      pts, 
      changePct: tvlChangePct, 
      currentTvl, 
      oldTvl,
      priceChange1h,
      skipped: false 
    };

  } catch (error) {
    logger.error({ error: error.message, tokenAddress }, 'Failed to compute TVL Velocity');
    return { pts: 0, changePct: 0, skipped: true, error: error.message };
  }
}

export default computeTvlVelocity;

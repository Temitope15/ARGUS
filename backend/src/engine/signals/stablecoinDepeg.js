/**
 * Signal 3: Stablecoin Depeg - Measures deviations from $1.00.
 */
import phase1Client from '../../api/phase1Client.js';
import { interpolateScore } from '../utils/interpolate.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('signal/depeg');

/**
 * Computes Stablecoin Depeg score points.
 */
export async function computeStablecoinDepeg(chain, tokenAddress) {
  try {
    const data = await phase1Client.getPriceDeviation(chain, tokenAddress, 60);
    
    if (!data || data.error) {
      return { pts: 0, depegPct: 0, skipped: true };
    }

    const currentPrice = data.currentPrice;
    // depegPct = (1 - currentPrice) * 100
    const depegPct = (1 - currentPrice) * 100;
    
    let pts = 0;
    if (depegPct > 0) {
      // $0.998 = 0.2% = 5pts, $0.995 or below = 0.5% = 20pts
      pts = interpolateScore(depegPct, 0.2, 0.5, 5, 20);
    }

    return { 
      pts, 
      depegPct, 
      price: currentPrice,
      symbol: data.symbol,
      skipped: false 
    };

  } catch (error) {
    logger.error({ error: error.message, tokenAddress }, 'Failed to compute Depeg score');
    return { pts: 0, depegPct: 0, skipped: true, error: error.message };
  }
}

export default computeStablecoinDepeg;

/**
 * Signal 2: LP Drain Rate - Measures spikes in liquidity removal.
 */
import phase1Client from '../../api/phase1Client.js';
import { interpolateScore } from '../utils/interpolate.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('signal/lp-drain');

/**
 * Computes LP Drain Rate score points.
 */
export async function computeLpDrainRate(chain, pairAddress) {
  try {
    // 120 minutes to cover current and prior hour
    const data = await phase1Client.getLiquidityDrain(chain, pairAddress, 120);
    
    if (!data || !data.events) {
      return { pts: 0, ratio: 0, skipped: true };
    }

    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const twoHoursAgo = now - (120 * 60 * 1000);

    const currentHourRemovals = data.events.filter(e => 
      e.event_type === 'removeLiquidity' && e.timestamp > oneHourAgo
    ).length;

    const priorHourRemovals = data.events.filter(e => 
      e.event_type === 'removeLiquidity' && e.timestamp <= oneHourAgo && e.timestamp > twoHoursAgo
    ).length;

    let ratio = 1;
    if (priorHourRemovals === 0) {
      ratio = currentHourRemovals >= 5 ? 10 : 1;
    } else {
      ratio = currentHourRemovals / priorHourRemovals;
    }

    // pts = interpolateScore(ratio, 3, 10, 15, 25)
    const pts = interpolateScore(ratio, 3, 10, 15, 25);

    return { 
      pts, 
      ratio, 
      currentCount: currentHourRemovals, 
      priorCount: priorHourRemovals,
      skipped: false 
    };

  } catch (error) {
    logger.error({ error: error.message, pairAddress }, 'Failed to compute LP Drain Rate');
    return { pts: 0, ratio: 0, skipped: true, error: error.message };
  }
}

export default computeLpDrainRate;

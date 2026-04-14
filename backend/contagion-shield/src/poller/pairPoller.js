/**
 * Pair Poller - Polls health metrics for all discovered pairs.
 * 
 * API: GET /v2/pairs/{pairId}
 * Response (after unwrap): { pair, chain, token0_symbol, reserve0, reserve1, tvl, ... }
 */
import pLimit from 'p-limit';
import aveClient from '../api/aveClient.js';
import eventNormalizer from '../normalizer/eventNormalizer.js';
import pairRepo from '../database/repositories/pairRepo.js';
import pairDiscoveryPoller from './pairDiscoveryPoller.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('pair-poller');
const limit = pLimit(5); // Rate limit to 5 concurrent requests

/**
 * Runs the pair health polling cycle for all discovered pairs.
 * @returns {Promise<void>}
 */
const run = async () => {
  try {
    const pairs = pairDiscoveryPoller.getDiscoveredPairs();
    
    if (pairs.length === 0) {
      logger.warn('No pairs discovered yet, skipping pair poll');
      return;
    }

    logger.debug({ count: pairs.length }, 'Polling pair health metrics...');
    
    const tasks = pairs.map(pair => limit(async () => {
      try {
        const pairId = `${pair.address}-${pair.chain}`;
        const data = await aveClient.getPairDetail(pairId);
        
        // data is already unwrapped: { pair, chain, tvl, ... } or empty {}
        if (!data || !data.pair) {
          logger.debug({ pairId }, 'Pair detail returned empty');
          return false;
        }
        
        const normalized = eventNormalizer.normalizePairSnapshot(data, pairId);
        if (!normalized) return false;
        
        await pairRepo.savePairSnapshot(normalized);
        
        return true;
      } catch (error) {
        logger.error({ pair: pair.address, error: error.message }, 'Failed to poll pair');
        return false;
      }
    }));

    const results = await Promise.all(tasks);
    const successCount = results.filter(Boolean).length;
    
    logger.info({ 
      total: pairs.length, 
      success: successCount 
    }, 'Pair health poll complete');
    
  } catch (error) {
    logger.error({ error: error.message }, 'Pair poller crashed');
    throw error;
  }
};

export default { run };

/**
 * TVL Poller - Polls token prices and TVL for all monitored tokens.
 * 
 * API: POST /v2/tokens/price
 * Response shape (after unwrap): { [tokenId]: { current_price_usd, tvl, price_change_24h, token_id, ... } }
 * — It's a MAP keyed by token-chain ID, not an array.
 */
import aveClient from '../api/aveClient.js';
import eventNormalizer from '../normalizer/eventNormalizer.js';
import tvlRepo from '../database/repositories/tvlRepo.js';
import { getTokenIds } from '../../../src/config/protocols.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('tvl-poller');

/**
 * Runs the TVL and price polling cycle.
 * @returns {Promise<void>}
 */
const run = async () => {
  try {
    const tokenIds = getTokenIds();
    logger.debug({ tokenIds }, 'Polling token prices and TVL...');
    
    const data = await aveClient.getTokenPrices(tokenIds);
    
    if (!data || typeof data !== 'object') {
      logger.warn('Token price response was empty or invalid');
      return;
    }

    // data is a map: { "0xABC-eth": { current_price_usd, tvl, ... }, ... }
    const entries = Object.entries(data);
    let totalTvl = 0;
    let count = 0;
    
    for (const [tokenId, tokenData] of entries) {
      if (!tokenData || typeof tokenData !== 'object') continue;
      
      // Inject token_id into the data for the normalizer to parse chain/address
      const enriched = { ...tokenData, token_id: tokenId };
      const normalized = eventNormalizer.normalizePriceSnapshot(enriched, 'rest_poll');
      
      if (!normalized) continue;
      
      await tvlRepo.savePriceSnapshot(normalized);
      totalTvl += normalized.tvl;
      count++;
      
      logger.debug({ 
        symbol: normalized.symbol || tokenId.split('-')[1],
        price: `$${normalized.priceUsd}`,
        tvl: `$${normalized.tvl.toLocaleString()}` 
      }, 'Saved TVL snapshot');
    }
    
    logger.info({ 
      tokens: count, 
      totalTvl: `$${totalTvl.toLocaleString()}`
    }, 'TVL poll complete');
    
  } catch (error) {
    logger.error({ error: error.message }, 'TVL poll failed');
    throw error;
  }
};

export default { run };

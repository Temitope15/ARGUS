/**
 * Pair Discovery Poller - Discovers top liquidity pairs for monitored tokens.
 * 
 * API: GET /v2/tokens/{tokenId}
 * Returns: { token: {...}, pairs: [{ pair, chain, amm, token0_symbol, ... }] }
 * 
 * The `pair` field is the pair address (not `pair_address`).
 */
import aveClient from '../api/aveClient.js';
import { protocols } from '../config/protocols.js';
import { createLogger } from '../utils/logger.js';
import wsManager from '../websocket/wsManager.js';

const logger = createLogger('pair-discovery');

// In-memory registry of discovered pairs
let discoveredPairs = [];
let subIdCounter = 100;

/**
 * Runs the discovery process for all configured protocols.
 * @returns {Promise<void>}
 */
const run = async () => {
  try {
    logger.info('Starting pair discovery...');
    const newPairs = [];

    for (const protocol of protocols) {
      const tokenId = `${protocol.address}-${protocol.chain}`;
      try {
        const data = await aveClient.getTokenDetail(tokenId);
        
        if (!data) {
          logger.warn({ token: protocol.symbol, chain: protocol.chain }, 'No data returned from token detail');
          continue;
        }

        // data = { token: {...}, pairs: [...], is_audited }
        const pairs = data.pairs || [];
        
        if (pairs.length === 0) {
          logger.warn({ token: protocol.symbol, chain: protocol.chain }, 'No pairs found for token');
          continue;
        }

        // Take top 5 pairs by TVL (they come pre-sorted from the API)
        const topPairs = pairs.slice(0, 5);
        
        for (const p of topPairs) {
          // Pair address field is `pair`, not `pair_address`
          const pairAddress = p.pair || p.pair_address || p.address;
          
          if (!pairAddress) {
            logger.warn({ pairData: Object.keys(p).join(',') }, 'Pair missing address');
            continue;
          }

          newPairs.push({
            address: pairAddress,
            chain: p.chain || protocol.chain,
            token: protocol.symbol,
            tokenAddress: protocol.address,
            amm: p.amm || 'unknown',
            token0Symbol: p.token0_symbol || '',
            token1Symbol: p.token1_symbol || ''
          });
        }
        
        logger.info({ 
          token: protocol.symbol, 
          chain: protocol.chain,
          pairsFound: topPairs.length,
          firstPair: topPairs[0]?.pair 
        }, 'Discovered pairs for token');
        
      } catch (err) {
        logger.error({ token: protocol.symbol, error: err.message }, 'Failed to discover pairs for token');
      }
    }

    // Check if pairs changed
    const pairCountBefore = discoveredPairs.length;
    discoveredPairs = newPairs;
    
    logger.info({ 
      discovered: discoveredPairs.length,
      previousCount: pairCountBefore 
    }, 'Pair discovery complete');

    // Trigger subscriptions if connection is active
    if (wsManager.isConnected) {
      _triggerResubscriptions();
    } else {
      // Listen for connection and then subscribe
      wsManager.once('connected', () => {
        _triggerResubscriptions();
      });
    }

  } catch (error) {
    logger.error({ error: error.message }, 'Pair discovery failed');
    throw error;
  }
};

const _triggerResubscriptions = () => {
  logger.info({ pairCount: discoveredPairs.length, tokenCount: protocols.length }, 
    'Triggering WebSocket subscriptions...');
  
  // 1. Subscribe to liquidity events for each discovered pair
  for (const pair of discoveredPairs) {
    const subId = subIdCounter++;
    wsManager.subscribe('liq', [pair.address, pair.chain], subId);
    logger.debug({ pair: pair.address, chain: pair.chain, subId }, 'Subscribed to liq events');
  }

  // 2. Subscribe to swap events for each monitored token (multi_tx)
  for (const p of protocols) {
    const subId = subIdCounter++;
    wsManager.subscribe('multi_tx', [p.address, p.chain], subId);
    logger.debug({ token: p.symbol, chain: p.chain, subId }, 'Subscribed to multi_tx');
  }

  logger.info({ 
    liqSubscriptions: discoveredPairs.length,
    swapSubscriptions: protocols.length 
  }, 'All WebSocket subscriptions sent');
};

/**
 * Public getter for other modules
 */
const getDiscoveredPairs = () => discoveredPairs;

export default { run, getDiscoveredPairs };
export { _triggerResubscriptions };

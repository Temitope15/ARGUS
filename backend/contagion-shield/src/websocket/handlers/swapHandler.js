/**
 * Swap Handler - Processes real-time swap transactions from WebSocket.
 * 
 * Receives events from wsManager 'swap_event' which carries:
 * { topic: 'tx', tx: { direction, pair_address, from_symbol, amount_usd, ... } }
 */
import wsManager from '../wsManager.js';
import eventNormalizer from '../../normalizer/eventNormalizer.js';
import swapRepo from '../../database/repositories/swapRepo.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('swap-handler');

/**
 * Handle swap event data from WS.
 */
const handleSwapEvent = async (data) => {
  try {
    if (!data) return;
    
    const normalized = eventNormalizer.normalizeSwap(data);
    if (!normalized) return;
    
    logger.debug({
      direction: normalized.isSell ? 'SELL' : 'BUY',
      amount: `$${normalized.amountUsd.toFixed(2)}`,
      pair: normalized.pairAddress?.substring(0, 10),
      from: normalized.fromToken,
      to: normalized.toToken
    }, 'Swap detected');

    // Persist to DB
    await swapRepo.saveSwapEvent(normalized);
    
  } catch (error) {
    logger.error({ error: error.message }, 'Error processing swap event');
  }
};

// Register listener 
export const init = () => {
  wsManager.on('swap_event', handleSwapEvent);
  logger.info('Swap handler initialized');
};

export default { init };

/**
 * Liquidity Handler - Processes real-time liquidity events from WebSocket.
 * 
 * Receives events from wsManager 'liq_event' which carries:
 * { topic: 'liq', tx: { type, amount_usd, wallet_address, ... } }
 */
import wsManager from '../wsManager.js';
import eventNormalizer from '../../normalizer/eventNormalizer.js';
import liquidityRepo from '../../database/repositories/liquidityRepo.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('liquidity-handler');

/**
 * Handle liquidity event data from WS.
 */
const handleLiquidityEvent = async (data) => {
  try {
    if (!data) return;
    
    const normalized = eventNormalizer.normalizeLiquidity(data);
    if (!normalized) return;
    
    // Log meaningful info
    logger.info({
      type: normalized.eventType,
      pair: normalized.pairAddress?.substring(0, 10),
      amount: `$${normalized.amountUsd.toLocaleString()}`,
      wallet: normalized.walletAddress?.substring(0, 10),
      block: normalized.blockNumber
    }, `${normalized.eventType} detected`);

    // Persist to DB
    await liquidityRepo.saveLiquidityEvent(normalized);
    
  } catch (error) {
    logger.error({ error: error.message }, 'Error processing liquidity event');
  }
};

// Register listener 
export const init = () => {
  wsManager.on('liq_event', handleLiquidityEvent);
  logger.info('Liquidity handler initialized');
};

export default { init };

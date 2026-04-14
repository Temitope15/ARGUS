/**
 * Price Handler - Processes real-time price change events from WebSocket.
 */
import wsManager from '../wsManager.js';
import eventNormalizer from '../../normalizer/eventNormalizer.js';
import tvlRepo from '../../database/repositories/tvlRepo.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('price-handler');

/**
 * Handle price event data from WS.
 */
const handlePriceEvent = async (data) => {
  try {
    if (!data) return;
    
    // Price events may come as { topic: 'price', tx: {...} } or direct data
    const priceData = data.tx || data;
    const normalized = eventNormalizer.normalizePriceSnapshot(priceData, 'websocket');
    if (!normalized) return;
    
    logger.debug({
      symbol: normalized.symbol,
      price: `$${normalized.priceUsd}`,
      change24h: `${normalized.priceChange24h}%`
    }, 'Price change detected');

    // Persist to DB
    await tvlRepo.savePriceSnapshot(normalized);
    
  } catch (error) {
    logger.error({ error: error.message }, 'Error processing price event');
  }
};

// Register listener 
export const init = () => {
  wsManager.on('price_event', handlePriceEvent);
  logger.info('Price handler initialized');
};

export default { init };

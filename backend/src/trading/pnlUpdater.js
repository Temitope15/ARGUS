/**
 * P&L Updater - Updates all open positions with current prices every 60s.
 * Also snapshots portfolio totals for P&L charting.
 */
import {
  getAllOpenPositions, updatePosition,
  getUsersWithPositions, getUserPortfolioValue,
  savePortfolioSnapshot
} from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('trading/pnl-updater');

// Simple price cache — updated from the poll cycle's price data
let priceCache = {};

/**
 * Updates the price cache with fresh data.
 * Called from the main poll cycle or whale detector.
 */
export function updatePriceCache(tokenId, priceUsd) {
  priceCache[tokenId] = {
    current_price_usd: priceUsd,
    updated_at: Date.now()
  };
}

/**
 * Bulk update price cache from an object map.
 */
export function bulkUpdatePriceCache(priceMap) {
  for (const [tokenId, data] of Object.entries(priceMap)) {
    priceCache[tokenId] = {
      current_price_usd: typeof data === 'number' ? data : data.current_price_usd,
      updated_at: Date.now()
    };
  }
}

/**
 * Updates P&L for all open positions.
 * @param {Object} io - Socket.io server instance for broadcasting
 */
export async function updateAllPositionsPnL(io) {
  try {
    const openPositions = await getAllOpenPositions();
    if (openPositions.length === 0) return;

    let updated = 0;

    for (const position of openPositions) {
      const priceData = priceCache[position.token_id];
      if (!priceData) continue;

      const currentPrice = parseFloat(priceData.current_price_usd);
      if (!currentPrice || currentPrice <= 0) continue;

      const pnlUsd = (currentPrice - position.entry_price_usd) * position.to_amount;
      const pnlPct = (currentPrice / position.entry_price_usd - 1) * 100;

      await updatePosition(position.id, {
        current_price_usd: currentPrice,
        pnl_usd: Math.round(pnlUsd * 100) / 100,
        pnl_pct: Math.round(pnlPct * 100) / 100
      });

      updated++;
    }

    // Snapshot portfolio totals for each user with positions
    const users = await getUsersWithPositions();
    for (const user of users) {
      const portfolio = await getUserPortfolioValue(user.id);
      await savePortfolioSnapshot(
        user.id,
        portfolio.totalValueUsd,
        portfolio.totalPnlUsd,
        portfolio.totalPnlPct
      );
    }

    if (updated > 0) {
      logger.debug({ updated, total: openPositions.length }, 'P&L updated');
    }

    // Broadcast to dashboard
    if (io) {
      io.emit('pnl_update', { timestamp: Date.now(), updated });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'P&L update failed');
  }
}

export default { updateAllPositionsPnL, updatePriceCache, bulkUpdatePriceCache };

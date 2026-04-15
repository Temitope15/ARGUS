/**
 * Portfolio & Positions Routes - Full portfolio overview, position management.
 */
import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import {
  getWallets, getPositions, getPosition, closePosition,
  getUserPortfolioValue, getPortfolioSnapshots, updateWallet, getWallet
} from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('routes/portfolio');
const router = Router();

/**
 * GET /api/portfolio
 * Full portfolio overview: wallets, open positions, total P&L, snapshot history.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const wallets = await getWallets(userId);
    const openPositions = await getPositions(userId, 'open');
    const closedPositions = await getPositions(userId, 'closed');
    const portfolio = await getUserPortfolioValue(userId);
    const snapshots = await getPortfolioSnapshots(userId, 50);

    res.json({
      wallets,
      open_positions: openPositions,
      closed_positions_count: closedPositions.length,
      total_value_usd: portfolio.totalValueUsd,
      total_pnl_usd: portfolio.totalPnlUsd,
      total_pnl_pct: portfolio.totalPnlPct,
      snapshots: snapshots.reverse() // chronological order for charts
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fetch portfolio');
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * GET /api/positions
 * All positions (optionally filter by status).
 */
router.get('/positions', requireAuth, async (req, res) => {
  try {
    const status = req.query.status; // 'open' | 'closed' | undefined (all)
    const positions = await getPositions(req.user.id, status);
    res.json({ positions });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fetch positions');
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * GET /api/positions/:id
 * Single position detail.
 */
router.get('/positions/:id', requireAuth, async (req, res) => {
  try {
    const position = await getPosition(parseInt(req.params.id));
    if (!position) return res.status(404).json({ error: 'Position not found' });
    if (position.user_id !== req.user.id) return res.status(403).json({ error: 'Not your position' });
    res.json({ position });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fetch position');
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/positions/:id/close
 * Close an open position (manual close).
 */
router.post('/positions/:id/close', requireAuth, async (req, res) => {
  try {
    const position = await getPosition(parseInt(req.params.id));
    if (!position) return res.status(404).json({ error: 'Position not found' });
    if (position.user_id !== req.user.id) return res.status(403).json({ error: 'Not your position' });
    if (position.status !== 'open') return res.status(400).json({ error: 'Position already closed' });

    // Use current_price if available, otherwise use entry_price (no change in P&L)
    const closePrice = position.current_price_usd || position.entry_price_usd;
    const result = await closePosition(position.id, closePrice, 'manual');

    // Return assets to wallet (the from_amount_usd + pnl)
    const returnUsd = position.from_amount_usd + (result.pnl_usd || 0);
    const wallet = await getWallet(req.user.id, position.from_asset);
    if (wallet) {
      const pricePerUnit = wallet.balance > 0 ? wallet.balance_usd / wallet.balance : 1;
      const returnAsset = returnUsd / (pricePerUnit || 1);
      await updateWallet(req.user.id, position.from_asset, {
        balance: wallet.balance + returnAsset,
        balance_usd: wallet.balance_usd + returnUsd
      });
    }

    logger.info({ positionId: position.id, pnlUsd: result.pnl_usd }, 'Position closed');
    res.json({ success: true, position: result });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to close position');
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * GET /api/portfolio/history
 * P&L history snapshots for charting.
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const snapshots = await getPortfolioSnapshots(req.user.id, limit);
    res.json({ snapshots: snapshots.reverse() }); // chronological
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fetch portfolio history');
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;

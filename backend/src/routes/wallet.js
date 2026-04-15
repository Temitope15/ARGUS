/**
 * Wallet Routes - Virtual wallet balances, funding, and history.
 */
import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { getWallets, upsertWallet, logFunding, getFundingHistory } from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('routes/wallet');
const router = Router();

// Supported assets — we use approximate/fallback prices if AVE lookup fails
const SUPPORTED_ASSETS = ['BTC', 'ETH', 'SOL', 'BNB', 'USDT'];
const FALLBACK_PRICES = {
  BTC: 65000,
  ETH: 3200,
  SOL: 150,
  BNB: 600,
  USDT: 1.0
};

// Rate limits per user
const fundingRateLimit = new Map(); // userId -> { count, resetAt }

/**
 * GET /api/wallet
 * Get all wallet balances for current user.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const wallets = await getWallets(req.user.id);
    const totalUsd = wallets.reduce((sum, w) => sum + w.balance_usd, 0);
    res.json({ wallets, total_usd: totalUsd });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fetch wallets');
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/wallet/fund
 * Fund wallet with virtual money.
 * Body: { asset: 'BTC', amount: 0.5 }
 */
router.post('/fund', requireAuth, async (req, res) => {
  try {
    const { asset, amount } = req.body;

    // Validate asset
    if (!asset || !SUPPORTED_ASSETS.includes(asset.toUpperCase())) {
      return res.status(400).json({ error: `Invalid asset. Supported: ${SUPPORTED_ASSETS.join(', ')}` });
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Round to reasonable precision
    const cleanAmount = Math.round(numAmount * 1e8) / 1e8;

    // Rate limit: max 10 times per hour per user
    const userId = req.user.id;
    const now = Date.now();
    const rl = fundingRateLimit.get(userId);
    if (rl && rl.resetAt > now) {
      if (rl.count >= 10) {
        return res.status(429).json({ error: 'Too many funding requests. Try again later.' });
      }
      rl.count++;
    } else {
      fundingRateLimit.set(userId, { count: 1, resetAt: now + 3600000 });
    }

    // Get price (use fallback for demo)
    const priceUsd = FALLBACK_PRICES[asset.toUpperCase()] || 1;
    const amountUsd = cleanAmount * priceUsd;

    // Upsert wallet
    const updatedWallet = await upsertWallet(userId, asset.toUpperCase(), cleanAmount, amountUsd);

    // Log funding event
    await logFunding(userId, asset.toUpperCase(), cleanAmount, amountUsd, priceUsd);

    logger.info({ userId, asset, amount: cleanAmount, amountUsd }, 'Wallet funded');

    res.json({
      asset: asset.toUpperCase(),
      amount_added: cleanAmount,
      amount_usd: amountUsd,
      price_at_funding: priceUsd,
      new_balance: updatedWallet.balance,
      new_balance_usd: updatedWallet.balance_usd
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fund wallet');
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * GET /api/wallet/history
 * Get funding history for current user.
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const history = await getFundingHistory(req.user.id);
    res.json({ history });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fetch history');
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * GET /api/wallet/prices
 * Get current prices for all supported assets.
 */
router.get('/prices', (req, res) => {
  res.json({ prices: FALLBACK_PRICES });
});

export default router;

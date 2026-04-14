/**
 * Signals API routes - Exposes data for Phase 2 (Risk Engine).
 */
import express from 'express';
import signalRepo from '../../database/repositories/signalRepo.js';
import liquidityRepo from '../../database/repositories/liquidityRepo.js';
import pairRepo from '../../database/repositories/pairRepo.js';
import swapRepo from '../../database/repositories/swapRepo.js';
import config from '../../config/index.js';

const router = express.Router();

// GET /api/signals/liquidity-drain
router.get('/liquidity-drain', async (req, res) => {
  const { chain, pairAddress, windowMinutes } = req.query;
  if (!chain || !pairAddress) return res.status(400).json({ error: 'chain and pairAddress required' });
  
  const windowMs = (parseInt(windowMinutes) || config.DEFAULTS.WINDOW_MINUTES) * 60 * 1000;
  const stats = await liquidityRepo.getLiquidityDrainStats(chain, pairAddress, windowMs);
  res.json(stats);
});

// GET /api/signals/tvl-history
router.get('/tvl-history', async (req, res) => {
  const { chain, tokenAddress, limit } = req.query;
  if (!chain || !tokenAddress) return res.status(400).json({ error: 'chain and tokenAddress required' });
  
  const queryLimit = parseInt(limit) || config.DEFAULTS.QUERY_LIMIT;
  const history = await signalRepo.getPriceHistory(chain, tokenAddress, queryLimit);
  res.json(history);
});

// GET /api/signals/pair-health
router.get('/pair-health', async (req, res) => {
  const { chain, pairAddress } = req.query;
  if (!chain || !pairAddress) return res.status(400).json({ error: 'chain and pairAddress required' });
  
  const snapshot = await pairRepo.getLatestPairSnapshot(chain, pairAddress);
  res.json(snapshot || { error: 'No snapshot found' });
});

// GET /api/signals/price-deviation
router.get('/price-deviation', async (req, res) => {
  const { chain, tokenAddress, windowMinutes } = req.query;
  if (!chain || !tokenAddress) return res.status(400).json({ error: 'chain and tokenAddress required' });

  const windowMs = (parseInt(windowMinutes) || config.DEFAULTS.WINDOW_MINUTES) * 60 * 1000;
  const history = await signalRepo.getPriceHistory(chain, tokenAddress, 100);
  const baseline = await signalRepo.getBaselinePrice(chain, tokenAddress, windowMs);
  
  if (!history.length || !baseline) return res.json({ error: 'Insufficient data' });
  
  const currentPrice = history[0].price_usd;
  const baselinePrice = baseline.price_usd;
  const deviationPercent = ((currentPrice - baselinePrice) / baselinePrice) * 100;

  res.json({
    tokenAddress,
    symbol: history[0].symbol,
    currentPrice,
    baselinePrice,
    deviationPercent,
    snapshots: history
  });
});

// GET /api/signals/sell-pressure
router.get('/sell-pressure', async (req, res) => {
  const { chain, pairAddress, windowMinutes } = req.query;
  if (!chain || !pairAddress) return res.status(400).json({ error: 'chain and pairAddress required' });

  const windowMs = (parseInt(windowMinutes) || config.DEFAULTS.WINDOW_MINUTES) * 60 * 1000;
  const stats = await swapRepo.getSellPressureStats(chain, pairAddress, windowMs);
  res.json(stats);
});

// GET /api/signals/contract-risk
router.get('/contract-risk', async (req, res) => {
  const { chain, tokenAddress } = req.query;
  if (!chain || !tokenAddress) return res.status(400).json({ error: 'chain and tokenAddress required' });
  
  const risk = await signalRepo.getLatestContractRisk(chain, tokenAddress);
  res.json(risk || { error: 'No risk data found' });
});

export default router;

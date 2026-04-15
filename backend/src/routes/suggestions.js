/**
 * Trade Suggestions Routes - List, accept, decline pending suggestions.
 */
import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { getPendingSuggestions, getSuggestion, updateSuggestion } from '../database/phase2Db.js';
import { executePaperTrade } from '../trading/executor.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('routes/suggestions');
const router = Router();

/**
 * GET /api/suggestions
 * Get pending suggestions for current user.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const suggestions = await getPendingSuggestions(req.user.id);
    // Expire any that are past their expiry
    const now = Math.floor(Date.now() / 1000);
    const active = [];
    for (const s of suggestions) {
      if (s.expires_at < now) {
        await updateSuggestion(s.id, { status: 'expired' });
      } else {
        active.push(s);
      }
    }
    res.json({ suggestions: active });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to fetch suggestions');
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/suggestions/:id/accept
 * Accept a suggestion and execute the paper trade.
 * Body: { amount_usd: 25.50 } — user can edit the amount.
 */
router.post('/:id/accept', requireAuth, async (req, res) => {
  try {
    const suggestionId = parseInt(req.params.id);
    const suggestion = await getSuggestion(suggestionId);

    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });
    if (suggestion.user_id !== req.user.id) return res.status(403).json({ error: 'Not your suggestion' });

    // Use provided amount or the suggested amount
    const amountUsd = parseFloat(req.body.amount_usd) || suggestion.suggested_amount;

    if (amountUsd <= 0) return res.status(400).json({ error: 'Amount must be positive' });

    const result = await executePaperTrade(req.user.id, suggestionId, amountUsd);
    
    logger.info({ suggestionId, amountUsd, positionId: result.position_id }, 'Suggestion accepted');
    res.json(result);
  } catch (error) {
    logger.warn({ error: error.message }, 'Failed to accept suggestion');
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/suggestions/:id/decline
 * Decline a suggestion.
 */
router.post('/:id/decline', requireAuth, async (req, res) => {
  try {
    const suggestionId = parseInt(req.params.id);
    const suggestion = await getSuggestion(suggestionId);

    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });
    if (suggestion.user_id !== req.user.id) return res.status(403).json({ error: 'Not your suggestion' });
    if (suggestion.status !== 'pending') return res.status(400).json({ error: 'Suggestion already responded to' });

    await updateSuggestion(suggestionId, {
      status: 'declined',
      responded_at: Math.floor(Date.now() / 1000)
    });

    logger.info({ suggestionId }, 'Suggestion declined');
    res.json({ success: true });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to decline suggestion');
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;

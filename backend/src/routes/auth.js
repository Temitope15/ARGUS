/**
 * Auth Routes - Telegram Login callback, current user info, logout.
 */
import { Router } from 'express';
import { verifyTelegramAuth, createOrUpdateUser, issueJWT } from '../auth/telegramAuth.js';
import { requireAuth } from '../auth/middleware.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('routes/auth');
const router = Router();

/**
 * GET /auth/telegram/callback
 * Telegram Login Widget redirects here with query params.
 * Verifies hash → creates/updates user → redirects to dashboard with JWT.
 */
router.get('/telegram/callback', async (req, res) => {
  try {
    const data = req.query;

    if (!data.hash || !data.id || !data.first_name) {
      return res.status(400).json({ error: 'Missing required Telegram auth fields' });
    }

    // Verify the hash
    if (!verifyTelegramAuth(data)) {
      return res.status(401).json({ error: 'Invalid Telegram auth data' });
    }

    // Create or update user
    const user = await createOrUpdateUser({
      id: data.id,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      photo_url: data.photo_url
    });

    // Issue JWT
    const token = issueJWT(user);

    // Redirect to frontend dashboard with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  } catch (error) {
    logger.error({ error: error.message }, 'Telegram auth callback failed');
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * GET /auth/me
 * Returns current user info (requires JWT).
 */
router.get('/me', requireAuth, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    telegram_id: user.telegram_id,
    telegram_username: user.telegram_username,
    telegram_first_name: user.telegram_first_name,
    telegram_last_name: user.telegram_last_name,
    telegram_photo_url: user.telegram_photo_url,
    auto_trade_enabled: !!user.auto_trade_enabled,
    auto_trade_max_pct: user.auto_trade_max_pct,
    risk_tolerance: user.risk_tolerance,
    created_at: user.created_at
  });
});

/**
 * POST /auth/logout
 * Client-side logout (JWT is stateless — client just discards token).
 */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out. Discard your token.' });
});

export default router;

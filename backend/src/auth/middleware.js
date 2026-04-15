/**
 * Auth Middleware - Protects routes that require authenticated users.
 */
import jwt from 'jsonwebtoken';
import { getUserById } from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth/middleware');

/**
 * Express middleware that verifies JWT and attaches user to req.
 * Expects: Authorization: Bearer <token>
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // First decode without verification to get userId
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user to retrieve their per-user JWT secret
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Now verify with the user's secret
    const secret = user.jwt_secret || process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server configuration error: JWT_SECRET missing' });
    const verified = jwt.verify(token, secret);

    // Attach user to request
    req.user = user;
    req.tokenPayload = verified;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    logger.warn({ error: error.message }, 'JWT verification failed');
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Telegram Auth - Verifies Telegram Login Widget hash and issues JWTs.
 */
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getUserByTelegramId, createUser, updateUserLogin } from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth/telegram');

/**
 * Verifies the Telegram Login Widget hash.
 * See: https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(data) {
  const { hash, ...fields } = data;
  if (!hash) return false;

  // Build check string: sorted key=value pairs joined by \n
  const checkString = Object.keys(fields)
    .sort()
    .map(k => `${k}=${fields[k]}`)
    .join('\n');

  // Secret key = SHA256 of bot token
  const secretKey = crypto
    .createHash('sha256')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  // Compute HMAC-SHA256
  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  // Must match AND auth_date must be within 24 hours
  const isValid = hmac === hash;
  const isFresh = (Date.now() / 1000 - parseInt(fields.auth_date)) < 86400;

  if (!isValid) logger.warn('Telegram auth hash mismatch');
  if (!isFresh) logger.warn('Telegram auth data is stale (>24h)');

  return isValid && isFresh;
}

/**
 * Creates or updates a user from Telegram login data.
 * Returns the user row.
 */
export async function createOrUpdateUser(telegramData) {
  const telegramId = String(telegramData.id);
  let user = await getUserByTelegramId(telegramId);

  if (user) {
    // Update existing user
    await updateUserLogin(telegramId, {
      telegram_username: telegramData.username || null,
      telegram_first_name: telegramData.first_name,
      telegram_last_name: telegramData.last_name || null,
      telegram_photo_url: telegramData.photo_url || null
    });
    user = await getUserByTelegramId(telegramId);
    logger.info({ telegramId, username: telegramData.username }, 'User logged in');
  } else {
    // Create new user
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const userId = await createUser({
      telegram_id: telegramId,
      telegram_username: telegramData.username || null,
      telegram_first_name: telegramData.first_name,
      telegram_last_name: telegramData.last_name || null,
      telegram_photo_url: telegramData.photo_url || null,
      jwt_secret: jwtSecret
    });
    user = await getUserByTelegramId(telegramId);
    logger.info({ telegramId, username: telegramData.username, userId }, 'New user created');
  }

  return user;
}

/**
 * Issues a JWT for the given user.
 */
export function issueJWT(user) {
  const payload = {
    userId: user.id,
    telegramId: user.telegram_id,
    username: user.telegram_username
  };

  // Use per-user secret for added security
  const secret = user.jwt_secret || process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

/**
 * Verifies a JWT and returns the decoded payload.
 */
export function verifyJWT(token, userJwtSecret) {
  const secret = userJwtSecret || process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return jwt.verify(token, secret);
}

/**
 * Phase 2 Configuration - Loads environment variables with defaults.
 */

const config = {
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  phase1ApiUrl: process.env.PHASE1_API_URL || `http://localhost:${process.env.PORT || '3001'}`,
  socketPort: parseInt(process.env.SOCKET_PORT || '3002'),
  
  dbPath: process.env.DB_PATH,
  tursoUrl: process.env.TURSO_URL,
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN,
  
  ave: {
    apiKey: process.env.AVE_API_KEY,
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID
  },

  // Poll intervals (ms)
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '60000'),
  canaryRefreshMs: parseInt(process.env.CANARY_REFRESH_MS || '21600000'), // 6 hours
  holderSurveillanceMs: parseInt(process.env.HOLDER_SURVEILLANCE_MS || '3600000') // 1 hour
};

export default config;

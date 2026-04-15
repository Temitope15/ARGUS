/**
 * Configuration module - Loads and validates environment variables.
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || process.env.INTERNAL_API_PORT || '3001', 10),
  dbPath: process.env.DB_PATH,
  tursoUrl: process.env.TURSO_URL,
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN,
  logLevel: process.env.LOG_LEVEL || 'info',
  
  ave: {
    apiKey: process.env.AVE_API_KEY,
    restPrimary: process.env.AVE_REST_PRIMARY || 'https://prod.ave-api.com',
    restFallback: process.env.AVE_REST_FALLBACK || 'https://data.ave-api.xyz',
    wssUrl: process.env.AVE_WSS_URL || 'wss://wss.ave-api.xyz',
  },
  
  intervals: {
    tvl: parseInt(process.env.POLL_INTERVAL_TVL_MS || '60000', 10),
    pair: parseInt(process.env.POLL_INTERVAL_PAIR_MS || '60000', 10),
    risk: parseInt(process.env.POLL_INTERVAL_RISK_MS || '300000', 10),
    discovery: parseInt(process.env.POLL_INTERVAL_DISCOVERY_MS || '21600000', 10),
  },
  
  // Constants
  DEFAULTS: {
    WINDOW_MINUTES: 60,
    QUERY_LIMIT: 60,
  }
};

// Validation
const requiredVars = ['AVE_API_KEY', 'DB_PATH'];
requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`CRITICAL: Missing required environment variable: ${varName}`);
  }
});

export default config;

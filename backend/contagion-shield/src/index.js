/**
 * ARGUS - DeFi Contagion Shield
 * Entry point - Orchestrates system startup.
 */
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import config from './config/index.js';
import { protocols } from './config/protocols.js';
import { initDb } from './database/db.js';
import signalRepo from './database/repositories/signalRepo.js';
import { createLogger } from './utils/logger.js';

// Import modules
import wsManager from './websocket/wsManager.js';
import liquidityHandler from './websocket/handlers/liquidityHandler.js';
import swapHandler from './websocket/handlers/swapHandler.js';
import priceHandler from './websocket/handlers/priceHandler.js';
import pollManager from './poller/pollManager.js';
import pairDiscoveryPoller from './poller/pairDiscoveryPoller.js';
import signalRoutes from './api/routes/signals.js';

const logger = createLogger('main');
const app = express();
const startTime = Date.now();

/**
 * Startup Sequence
 */
async function bootstrap() {
  try {
    logger.info(`
    ==================================================
       ARGUS - DeFi Contagion Shield (Phase 1)
    ==================================================
    `);

    // 1. Initialize Database
    await initDb();
    
    // 2. Initialize WebSocket Handlers (Register listeners)
    liquidityHandler.init();
    swapHandler.init();
    priceHandler.init();

    // 3. Run Pair Discovery (Startup run)
    await pairDiscoveryPoller.run();

    // 4. Start WebSocket connection
    await wsManager.connect();

    // 5. Start Polling Manager
    await pollManager.start();

    // 6. Setup Express API
    app.use(cors({
      origin: (origin, callback) => {
        // Allow requests from any origin (dashboard can be on any domain)
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json());
    
    // Health Check Endpoint
    app.get('/api/health', async (req, res) => {
      const dbStats = await signalRepo.getSignalCounts();
      res.json({
        status: "ok",
        uptime: Math.floor((Date.now() - startTime) / 1000),
        wsConnections: wsManager.getStats(),
        lastPollAt: Date.now(), // Simplified
        dbSize: fs.existsSync(config.dbPath) ? fs.statSync(config.dbPath).size : 0,
        signalCounts: dbStats
      });
    });

    app.use('/api/signals', signalRoutes);

    // 7. Start Server
    app.listen(config.port, () => {
      logger.info(`Internal API server running on port ${config.port}`);
      _printStartupBanner();
    });

  } catch (err) {
    logger.error({ error: err.stack }, 'FATAL: System failed to boot');
    process.exit(1);
  }
}

function _printStartupBanner() {
  const monitored = protocols.map(p => `${p.symbol} (${p.chain})`).join(', ');
  const pairs = pairDiscoveryPoller.getDiscoveredPairs().length;
  
  logger.info('----------------------------------------------');
  logger.info(`Monitored Tokens: ${monitored}`);
  logger.info(`Discovered Pairs: ${pairs}`);
  logger.info(`WS URL: ${config.ave.wssUrl}`);
  logger.info(`API Key: ${config.ave.apiKey.substring(0, 8)}...`);
  logger.info(`Environment: ${config.env}`);
  logger.info('ARGUS is now shielding DeFi assets.');
  logger.info('----------------------------------------------');
}

// Global Exception Handlers
process.on('uncaughtException', (err) => {
  logger.error({ error: err.message, stack: err.stack }, 'Uncaught Exception');
  // Attempt graceful shutdown if possible, but for competitive build we log and keep going if possible
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason }, 'Unhandled Rejection');
});

// Boot the system
bootstrap();

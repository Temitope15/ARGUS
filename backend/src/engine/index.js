/**
 * ARGUS — The hundred eyes of DeFi
 * Phase 2: Risk Engine
 */
import 'dotenv/config';
import { initPhase2Db } from '../database/phase2Db.js';
import phase1Client from '../api/phase1Client.js';
import socketServer from '../broadcast/socketServer.js';
import { runPollCycle } from './pollCycle.js';
import { refreshCanaries } from '../tasks/canaryRefresh.js';
import { runHolderSurveillance } from '../tasks/holderSurveillance.js';
import { MONITORED_PROTOCOLS } from '../config/protocols.js';
import { createLogger } from '../utils/logger.js';
import telegramBot from '../alerts/telegramBot.js';

const logger = createLogger('engine/main');

async function bootstrap() {
  try {
    logger.info(`
    ╔══════════════════════════════════════╗
    ║  ARGUS — The hundred eyes of DeFi   ║
    ║  Phase 2: Risk Engine               ║
    ╚══════════════════════════════════════╝
    `);

    // 1. Database Initialization
    initPhase2Db();

    // 2. Telegram Bot Initialization (after DB — creates subscribers table)
    telegramBot.init();

    // 2. Phase 1 Dependency Check
    logger.info('Performing Phase 1 dependency check...');
    const isPhase1Healthy = await phase1Client.checkHealth();
    if (!isPhase1Healthy) {
      logger.error('ARGUS Phase 1 (data pipeline) is not running.');
      logger.error('Start it first: cd contagion-shield && npm run dev');
      process.exit(1);
    }
    logger.info('Phase 1 connection: ✓ healthy');

    // 3. Initial Task Runs (non-blocking — wrap in try/catch)
    logger.info('Running initial surveillance tasks...');
    
    // Canary refresh — non-critical
    try {
      await refreshCanaries('eth');
      await refreshCanaries('bsc');
    } catch (err) {
      logger.warn({ error: err.message }, 'Initial canary refresh failed (non-critical)');
    }
    
    // Holder surveillance — non-critical
    for (const p of MONITORED_PROTOCOLS) {
      try {
        await runHolderSurveillance(p.tokenId);
      } catch (err) {
        logger.warn({ tokenId: p.tokenId, error: err.message }, 'Initial holder surveillance failed (non-critical)');
      }
    }

    // 4. Start Socket.io + REST API Server
    socketServer.start();
    logger.info(`Socket.io + REST API: http://localhost:${process.env.SOCKET_PORT || 3002}`);

    // 5. Start Main Poll Cycle (every 60s)
    logger.info('Starting main risk evaluation cycle (60s interval)...');
    
    // Initial run
    const initialScores = await runPollCycle();
    if (initialScores.length > 0) {
      logger.info(`First cycle complete — ${initialScores.map(s => `${s.protocolName}: ${s.score} ${s.alertLevel}`).join(', ')}`);
    }
    
    // Recurring cycle
    setInterval(runPollCycle, 60 * 1000);

    // 6. Schedule Background Tasks
    // Canary refresh every 6 hours
    setInterval(() => {
      refreshCanaries('eth').catch(e => logger.warn({ error: e.message }, 'Canary refresh failed'));
      refreshCanaries('bsc').catch(e => logger.warn({ error: e.message }, 'Canary refresh failed'));
    }, 6 * 60 * 60 * 1000);

    // Holder surveillance every 60 minutes
    setInterval(() => {
      for (const p of MONITORED_PROTOCOLS) {
        runHolderSurveillance(p.tokenId).catch(e => 
          logger.warn({ error: e.message }, 'Holder surveillance failed')
        );
      }
    }, 60 * 60 * 1000);

    logger.info('----------------------------------------------');
    logger.info('ARGUS Risk Engine fully operational.');
    logger.info(`Monitoring ${MONITORED_PROTOCOLS.length} protocols:`);
    for (const p of MONITORED_PROTOCOLS) {
      logger.info(`  → ${p.name} on ${p.chain}`);
    }
    logger.info('----------------------------------------------');

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Bootstrap FAILED');
    process.exit(1);
  }
}

// Error handling for the process
process.on('uncaughtException', (err) => {
  logger.fatal({ error: err.message, stack: err.stack }, 'Uncaught Exception');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason: String(reason) }, 'Unhandled Rejection');
});

bootstrap();

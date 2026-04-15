/**
 * ARGUS — Unified Backend Entry Point for Production (Render)
 * 
 * Runs Phase 1 (Data Pipeline) and Phase 2 (Risk Engine) in a single process.
 * Phase 3 adds: Paper Trading, Telegram Login, P&L Updates, Whale Detection.
 * Phase 1's Express + Phase 2's Socket.io share the same HTTP server on PORT.
 * 
 * Why unified? Render free tier = 1 service. Running separately would need 2 services.  
 * In production with more budget, these can be split back into separate services.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import fs from 'fs';

// Phase 1 imports
import p1Config from './contagion-shield/src/config/index.js';
import { protocols } from './contagion-shield/src/config/protocols.js';
import { initDb } from './contagion-shield/src/database/db.js';
import signalRepo from './contagion-shield/src/database/repositories/signalRepo.js';
import wsManager from './contagion-shield/src/websocket/wsManager.js';
import liquidityHandler from './contagion-shield/src/websocket/handlers/liquidityHandler.js';
import swapHandler from './contagion-shield/src/websocket/handlers/swapHandler.js';
import priceHandler from './contagion-shield/src/websocket/handlers/priceHandler.js';
import pollManager from './contagion-shield/src/poller/pollManager.js';
import pairDiscoveryPoller from './contagion-shield/src/poller/pairDiscoveryPoller.js';
import signalRoutes from './contagion-shield/src/api/routes/signals.js';
import { createLogger as createP1Logger } from './contagion-shield/src/utils/logger.js';

// Phase 2 imports
import { initPhase2Db } from './src/database/phase2Db.js';
import { runPollCycle } from './src/engine/pollCycle.js';
import { refreshCanaries } from './src/tasks/canaryRefresh.js';
import { runHolderSurveillance } from './src/tasks/holderSurveillance.js';
import { MONITORED_PROTOCOLS } from './src/config/protocols.js';
import { evaluateAlerts } from './src/engine/alertEvaluator.js';
import telegramBot from './src/alerts/telegramBot.js';
import p2Db, { resetUserData, getUserByTelegramId } from './src/database/phase2Db.js';
import { createLogger as createP2Logger } from './src/utils/logger.js';

// Phase 3 imports
import authRoutes from './src/routes/auth.js';
import walletRoutes from './src/routes/wallet.js';
import portfolioRoutes from './src/routes/portfolio.js';
import suggestionsRoutes from './src/routes/suggestions.js';
import { initWhaleDetector, onLiquidityEvent } from './src/trading/whaleDetector.js';
import { updateAllPositionsPnL } from './src/trading/pnlUpdater.js';
import { initEcosystemReport } from './src/tasks/ecosystemReport.js';

const logger = createP1Logger('unified-server');
const PORT = parseInt(process.env.PORT || '3001');
const startTime = Date.now();

async function bootstrap() {
  try {
    logger.info(`
    ╔═══════════════════════════════════════════╗
    ║  ARGUS — DeFi Contagion Shield            ║
    ║  Unified Server (Phase 1 + 2 + 3)         ║
    ║  Paper Trading + Telegram Login            ║
    ╚═══════════════════════════════════════════╝
    `);

    // =============================================
    // 1. Shared Express + HTTP + Socket.io
    // =============================================
    const app = express();
    
    // CORS — allow any origin (dashboard could be on Vercel, localhost, etc.)
    app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    app.use(express.json());

    const httpServer = createServer(app);
    const io = new SocketServer(httpServer, {
      cors: {
        origin: true,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // =============================================
    // 2. Phase 1: Data Pipeline
    // =============================================
    logger.info('Starting Phase 1: Data Pipeline...');
    await initDb();
    liquidityHandler.init();
    swapHandler.init();
    priceHandler.init();
    await pairDiscoveryPoller.run();
    await wsManager.connect();
    await pollManager.start();

    // Phase 1 API routes
    app.get('/api/health', async (req, res) => {
      const dbStats = await signalRepo.getSignalCounts();
      res.json({
        status: "ok",
        uptime: Math.floor((Date.now() - startTime) / 1000),
        wsConnections: wsManager.getStats(),
        lastPollAt: Date.now(),
        dbSize: fs.existsSync(p1Config.dbPath) ? fs.statSync(p1Config.dbPath).size : 0,
        signalCounts: dbStats,
        engine: {
          phase1: true,
          phase2: true,
          phase3: true,
          telegram: !!process.env.TELEGRAM_BOT_TOKEN
        }
      });
    });

    app.use('/api/signals', signalRoutes);
    logger.info('Phase 1: Data Pipeline ✓');

    // =============================================
    // 3. Phase 2: Risk Engine
    // =============================================
    logger.info('Starting Phase 2: Risk Engine...');
    await initPhase2Db();

    // Telegram Bot
    await telegramBot.init();

    // Canary refresh (non-critical)
    try {
      await refreshCanaries('eth');
      await refreshCanaries('bsc');
    } catch (err) {
      logger.warn({ error: err.message }, 'Canary refresh failed (non-critical)');
    }

    // Holder surveillance (non-critical)
    for (const p of MONITORED_PROTOCOLS) {
      try { await runHolderSurveillance(p.tokenId); } catch (e) { /* non-critical */ }
    }

    // Socket.io handlers — reuse the shared io instance
    let latestScores = [];

    io.on('connection', (socket) => {
      logger.info({ socketId: socket.id }, 'Dashboard client connected');
      if (latestScores.length > 0) {
        socket.emit('scores_updated', { timestamp: Date.now(), scores: latestScores });
      }
      socket.on('disconnect', () => {
        logger.debug({ socketId: socket.id }, 'Dashboard client disconnected');
      });
    });

    // Wire live events to Socket.io for the Dashboard's LiveFeed
    wsManager.on('swap_event', (result) => {
      if (!result || !result.tx) return;
      const tx = result.tx;
      const isRed = parseInt(tx.amount_usd || '0') > 10000;
      io.emit('signal_event', {
        id: tx.tx_hash || Math.random().toString(),
        type: 'swap',
        description: `Live Swap: ${tx.from_token} → ${tx.to_token} on ${result.address?.substring(0,6)}`,
        protocolId: result.chain || 'eth',
        amountUsd: parseInt(tx.amount_usd || '0'),
        severity: isRed ? 'high' : 'low',
        timestamp: Date.now()
      });
    });

    wsManager.on('liq_event', (result) => {
      if (!result || !result.tx) return;
      const tx = result.tx;

      // Phase 3: Feed liquidity events to whale detector
      try {
        onLiquidityEvent(result, result.chain || 'eth');
      } catch (e) {
        logger.debug({ error: e.message }, 'Whale detector processing failed (non-critical)');
      }

      if (tx.action === 'removeLiquidity') {
        const isRed = parseInt(tx.amount_usd || '0') > 20000;
        io.emit('signal_event', {
          id: tx.tx_hash || Math.random().toString(),
          type: 'lp_removal',
          description: `Liquidity Removed: ${tx.token1_symbol || 'Tokens'} from pool`,
          protocolId: result.chain || 'eth',
          amountUsd: parseInt(tx.amount_usd || '0'),
          severity: isRed ? 'high' : 'medium',
          timestamp: Date.now()
        });
      }
    });

    // Phase 2 REST API
    app.get('/api/scores/latest', (req, res) => {
      res.json({ timestamp: Date.now(), scores: latestScores });
    });

    app.get('/api/scores/history/:protocolId', async (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      try {
        const result = await p2Db.execute({
          sql: 'SELECT * FROM scores WHERE protocol_id = ? ORDER BY computed_at DESC LIMIT ?',
          args: [req.params.protocolId, limit]
        });
        res.json({ protocolId: req.params.protocolId, history: result.rows });
      } catch (e) {
        logger.error({ error: e.message }, 'Failed to fetch score history');
        res.status(500).json({ error: 'Internal error' });
      }
    });

    app.get('/api/scores/all', async (req, res) => {
      try {
        const result = await p2Db.execute(`
          SELECT s1.* FROM scores s1
          INNER JOIN (SELECT protocol_id, MAX(computed_at) as max_at FROM scores GROUP BY protocol_id) s2
          ON s1.protocol_id = s2.protocol_id AND s1.computed_at = s2.max_at
        `);
        res.json({ scores: result.rows });
      } catch (e) {
        logger.error({ error: e.message }, 'Failed to fetch all scores');
        res.status(500).json({ error: 'Internal error' });
      }
    });

    app.get('/api/alerts/recent', async (req, res) => {
      const limit = parseInt(req.query.limit) || 20;
      try {
        const result = await p2Db.execute({
          sql: 'SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?',
          args: [limit]
        });
        res.json({ alerts: result.rows });
      } catch (e) {
        logger.error({ error: e.message }, 'Failed to fetch recent alerts');
        res.status(500).json({ error: 'Internal error' });
      }
    });

    // Phase D: Wallet Exposure (Dashboard "My Positions")
    app.get('/api/wallet/:address/exposure', async (req, res) => {
      const address = req.params.address;
      const chain = req.query.chain || 'eth'; // Default to eth

      try {
        // 1. Fetch real token holdings for the wallet via AVE API
        const { default: aveRestClient } = await import('./src/api/aveRestClient.js');
        const walletResult = await aveRestClient.getWalletTokens(address, chain);
        
        if (walletResult.error || !walletResult.data) {
          logger.warn({ address, error: walletResult.error }, 'Failed to fetch wallet tokens from AVE');
          return res.status(500).json({ error: walletResult.error || 'Failed to fetch wallet tokens' });
        }

        const holdings = walletResult.data;
        
        // 2. Cross-reference with our in-memory latestScores
        const exposure = holdings.map(tokenAsset => {
           const matchingProtocol = MONITORED_PROTOCOLS.find(p => p.chain === chain && p.tokenId.toLowerCase().startsWith(tokenAsset.token.toLowerCase()));
           let riskData = null;

           if (matchingProtocol) {
             const scoreData = latestScores.find(s => s.protocolId === matchingProtocol.id);
             if (scoreData) {
               riskData = {
                 score: scoreData.score,
                 alertLevel: scoreData.alertLevel,
                 protocolId: scoreData.protocolId,
                 protocolName: scoreData.protocolName
               };
             } else {
               riskData = {
                 score: 48,
                 alertLevel: 'ORANGE',
                 protocolId: matchingProtocol.id,
                 protocolName: matchingProtocol.symbol || 'Protocol'
               };
             }
           }

           return {
             tokenAddress: tokenAsset.token,
             symbol: tokenAsset.symbol || 'UNKNOWN',
             balance: tokenAsset.balance || 0,
             valueUsd: tokenAsset.value || 0,
             isMonitored: !!matchingProtocol,
             risk: riskData
           };
        });

        // Sort by value DESC
        exposure.sort((a, b) => b.valueUsd - a.valueUsd);
        
        // Compute Summary
        const totalValue = exposure.reduce((sum, item) => sum + item.valueUsd, 0);
        const atRiskValue = exposure.filter(item => item.risk && item.risk.score >= 46).reduce((sum, item) => sum + item.valueUsd, 0);

        res.json({
          address,
          chain,
          totalValueUsd: totalValue,
          atRiskValueUsd: atRiskValue,
          holdings: exposure,
          timestamp: Date.now()
        });
      } catch (err) {
         logger.error({ error: err.message, stack: err.stack }, 'Exposure endpoint failed');
         res.status(500).json({ error: 'Internal server error processing wallet exposure.' });
      }
    });

    // =============================================
    // 4. Phase 3: Paper Trading System
    // =============================================
    logger.info('Starting Phase 3: Paper Trading System...');

    // Mount Phase 3 API routes
    app.use('/auth', authRoutes);
    app.use('/api/wallet', walletRoutes);
    app.use('/api/portfolio', portfolioRoutes);
    app.use('/api', portfolioRoutes); // Also mount at /api for /api/positions
    app.use('/api/suggestions', suggestionsRoutes);

    // Initialize whale detector with telegram bot
    initWhaleDetector(telegramBot);

    // Initialize ecosystem report scheduler
    initEcosystemReport(telegramBot);

    // Dev reset endpoint (for demo)
    app.post('/dev/reset', async (req, res) => {
      try {
        const { telegram_id } = req.body;
        if (!telegram_id) return res.status(400).json({ error: 'telegram_id required' });
        const user = await getUserByTelegramId(String(telegram_id));
        if (!user) return res.status(404).json({ error: 'User not found' });
        await resetUserData(user.id);
        res.json({ success: true, message: 'User data reset' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    logger.info('Phase 3: Paper Trading System ✓');

    // Override socketServer.broadcastScores for unified mode
    const broadcastScores = (scores) => {
      latestScores = scores.map(s => ({ ...s, computedAt: Date.now() }));
      io.emit('scores_updated', { timestamp: Date.now(), scores: latestScores });
    };

    // Modified poll cycle that uses our broadcast function
    const runUnifiedPollCycle = async () => {
      const cycleScores = await runPollCycle();
      if (cycleScores && cycleScores.length > 0) {
        broadcastScores(cycleScores);
      }
    };

    // Initial poll cycle
    await runUnifiedPollCycle();
    setInterval(runUnifiedPollCycle, 60 * 1000);

    // Phase 3: P&L update loop (every 60s, offset by 30s from poll cycle)
    setTimeout(() => {
      setInterval(() => updateAllPositionsPnL(io), 60 * 1000);
    }, 30 * 1000);

    // Background tasks
    setInterval(() => {
      refreshCanaries('eth').catch(() => {});
      refreshCanaries('bsc').catch(() => {});
    }, 6 * 60 * 60 * 1000);

    setInterval(() => {
      for (const p of MONITORED_PROTOCOLS) {
        runHolderSurveillance(p.tokenId).catch(() => {});
      }
    }, 60 * 60 * 1000);

    logger.info('Phase 2: Risk Engine ✓');

    // =============================================
    // 5. Start Unified Server
    // =============================================
    httpServer.listen(PORT, '0.0.0.0', () => {
      const monitored = protocols.map(p => `${p.symbol} (${p.chain})`).join(', ');
      const pairs = pairDiscoveryPoller.getDiscoveredPairs().length;
      
      logger.info('══════════════════════════════════════════');
      logger.info(`🛡️  ARGUS Unified Server: http://0.0.0.0:${PORT}`);
      logger.info(`📡 Phase 1: Data Pipeline OK`);
      logger.info(`🧠 Phase 2: Risk Engine OK`);
      logger.info(`💰 Phase 3: Paper Trading OK`);
      logger.info(`🤖 Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? 'ACTIVE' : 'DISABLED'}`);
      logger.info(`📊 Tokens: ${monitored}`);
      logger.info(`🔗 Pairs: ${pairs}`);
      logger.info('══════════════════════════════════════════');
    });

  } catch (err) {
    logger.error({ error: err.stack }, 'FATAL: Unified server failed to boot');
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message, err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', String(reason));
});

bootstrap();

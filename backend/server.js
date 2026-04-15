/**
 * ARGUS — Unified Backend Entry Point
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import fs from 'fs';

// Phase 1 imports
import p1Config from './contagion-shield/src/config/index.js';
import { protocols as p1Protocols } from './contagion-shield/src/config/protocols.js';
import { initDb as initP1Db } from './contagion-shield/src/database/db.js';
import signalRepo from './contagion-shield/src/database/repositories/signalRepo.js';
import wsManager from './contagion-shield/src/websocket/wsManager.js';
import liquidityHandler from './contagion-shield/src/websocket/handlers/liquidityHandler.js';
import swapHandler from './contagion-shield/src/websocket/handlers/swapHandler.js';
import priceHandler from './contagion-shield/src/websocket/handlers/priceHandler.js';
import pollManager from './contagion-shield/src/poller/pollManager.js';
import pairDiscoveryPoller from './contagion-shield/src/poller/pairDiscoveryPoller.js';
import { createLogger as createP1Logger } from './contagion-shield/src/utils/logger.js';

// Phase 2/3 imports
import * as db from './src/database/phase2Db.js';
import { runPollCycle } from './src/engine/pollCycle.js';
import { MONITORED_PROTOCOLS } from './src/config/protocols.js';
import telegramBot from './src/alerts/telegramBot.js';
import { initWhaleDetector, onLiquidityEvent } from './src/trading/whaleDetector.js';
import { initEcosystemReport } from './src/tasks/ecosystemReport.js';

const logger = createP1Logger('unified-server');
const PORT = parseInt(process.env.PORT || '3001');
const startTime = Date.now();

async function bootstrap() {
  try {
    logger.info(`
    ╔═══════════════════════════════════════════╗
    ║  ARGUS — DeFi Monitor                     ║
    ║  Unified Server                           ║
    ╚═══════════════════════════════════════════╝
    `);

    const app = express();
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());

    const httpServer = createServer(app);
    const io = new SocketServer(httpServer, {
      cors: { origin: true, credentials: true }
    });

    // 1. Initialize DBs
    await initP1Db();
    await db.initPhase2Db();

    // 2. Start Data Pipeline (Phase 1)
    liquidityHandler.init();
    swapHandler.init();
    priceHandler.init();
    await pairDiscoveryPoller.run();
    await wsManager.connect();
    await pollManager.start();

    // 3. Start Monitoring Engine (Phase 2 & 3)
    initWhaleDetector();
    initEcosystemReport();

    // Logic for socket broadcasts
    let latestScores = [];

    io.on('connection', (socket) => {
      logger.info({ socketId: socket.id }, 'Dashboard client connected');
      if (latestScores.length > 0) {
        socket.emit('scores_update', { protocols: latestScores, timestamp: Date.now() });
      }
    });

    // Wire live events to Socket and Whale Detector
    wsManager.on('liq_event', (result) => {
      if (!result || !result.tx) return;
      onLiquidityEvent(result, result.chain || 'eth');
      
      const tx = result.tx;
      if (tx.action === 'removeLiquidity') {
        io.emit('feed_update', {
          events: [{
            id: tx.tx_hash || Math.random().toString(),
            timestamp: Date.now(),
            time_ago: 'Just now',
            protocol_name: result.name || 'Protocol',
            event_type: 'LP_DRAIN',
            badge_color: 'orange',
            title: 'Large LP Removal',
            description: `${tx.token1_symbol || 'Tokens'} removed from pool`,
            wallet: tx.wallet_address?.substring(0, 10),
            wallet_full: tx.wallet_address,
            amount_usd: parseFloat(tx.amount_usd || '0'),
            chain: result.chain
          }]
        });
      }
    });

    // API Routes
    app.get('/api/stats', async (req, res) => {
      const stats = await db.getStats();
      const alertsToday = await db.countAlertsToday();
      const whaleMoves = await db.countWhaleMovesToday();
      const subscribers = await db.countSubscribers();
      
      res.json({
        protocols_monitored: MONITORED_PROTOCOLS.length,
        alerts_fired_today: alertsToday,
        whale_moves_detected: whaleMoves,
        active_subscribers: subscribers
      });
    });

    app.get('/api/protocols/scores', async (req, res) => {
      const scores = await db.getAllLatestScores();
      const formatted = MONITORED_PROTOCOLS.map(p => {
        const s = scores.find(score => score.protocol_id === p.id);
        return {
          id: p.id,
          name: p.name,
          chain: p.chain,
          score: s ? s.score : 0,
          alert_level: s ? s.alert_level : 'GREEN',
          tvl_usd: 0, // Need to fetch from Phase 1 or snapshots
          tvl_formatted: '$???M',
          signals: s ? {
            tvl_velocity: { pts: s.signal_tvl_pts, max: 25 },
            lp_drain: { pts: s.signal_lp_pts, max: 25 },
            depeg: { pts: s.signal_depeg_pts, max: 20 },
            smart_money: { pts: s.signal_smart_money_pts, max: 20 },
            ave_risk: { pts: s.signal_ave_risk_pts, max: 10 }
          } : {}
        };
      });
      res.json({ protocols: formatted });
    });

    app.get('/api/feed', async (req, res) => {
      try {
        // Query recent alerts
        const qAlerts = await db.execute('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 30');
        // Query recent whale exits
        const qWhales = await db.execute('SELECT * FROM canary_exits ORDER BY occurred_at DESC LIMIT 30');

        const events = [
          ...qAlerts.rows.map(a => ({
            id: `alert-${a.id}`,
            timestamp: a.created_at,
            time_ago: `${Math.floor((Date.now() - a.created_at) / 60000)}m ago`,
            protocol_name: MONITORED_PROTOCOLS.find(p => p.id === a.protocol_id)?.name || a.protocol_id,
            event_type: 'RISK_SPIKE',
            badge_color: a.alert_level === 'RED' ? 'red' : (a.alert_level === 'ORANGE' ? 'orange' : 'yellow'),
            title: `Risk Threshold: ${a.alert_level}`,
            description: a.message,
            amount_usd: 0,
            chain: 'eth'
          })),
          ...qWhales.rows.map(w => ({
            id: `whale-${w.id}`,
            timestamp: w.occurred_at * 1000,
            time_ago: `${Math.floor((Date.now() - w.occurred_at * 1000) / 60000)}m ago`,
            protocol_name: MONITORED_PROTOCOLS.find(p => p.id === w.protocol_id)?.name || w.protocol_id,
            event_type: w.exit_type === 'exit' ? 'WHALE_ENTRY' : 'LP_DRAIN',
            badge_color: 'orange',
            title: w.exit_type === 'exit' ? 'Whale Entry Detected' : 'Smart Money Exit',
            description: `Wallet ${w.wallet_address?.substring(0, 10)} moved $${Math.round(w.amount_usd || 0).toLocaleString()}`,
            wallet: w.wallet_address?.substring(0, 10),
            wallet_full: w.wallet_address,
            amount_usd: w.amount_usd,
            chain: 'eth'
          }))
        ];

        events.sort((a, b) => b.timestamp - a.timestamp);
        res.json({ events: events.slice(0, 50) });
      } catch (err) {
        logger.error({ error: err.message }, 'Failed to fetch feed');
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', uptime: Math.floor((Date.now() - startTime) / 1000) });
    });

    // Poll Cycle Loop
    const runUnifiedPollCycle = async () => {
      const cycleScores = await runPollCycle();
      if (cycleScores && cycleScores.length > 0) {
        latestScores = cycleScores;
        io.emit('scores_update', { protocols: latestScores, timestamp: Date.now() });
        io.emit('stats_update', await db.getStats());
      }
    };

    await runUnifiedPollCycle();
    setInterval(runUnifiedPollCycle, 60 * 1000);

    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`🛡️  ARGUS Unified Server: http://0.0.0.0:${PORT}`);
    });

  } catch (err) {
    logger.error({ error: err.stack }, 'FATAL: Server failed to boot');
    process.exit(1);
  }
}

bootstrap();

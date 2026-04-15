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
import { initDb as initP1Db } from './contagion-shield/src/database/db.js';
import signalRepo from './contagion-shield/src/database/repositories/signalRepo.js';
import wsManager from './contagion-shield/src/websocket/wsManager.js';
import liquidityHandler from './contagion-shield/src/websocket/handlers/liquidityHandler.js';
import swapHandler from './contagion-shield/src/websocket/handlers/swapHandler.js';
import priceHandler from './contagion-shield/src/websocket/handlers/priceHandler.js';
import pollManager from './contagion-shield/src/poller/pollManager.js';
import pairDiscoveryPoller from './contagion-shield/src/poller/pairDiscoveryPoller.js';
import tvlPoller from './contagion-shield/src/poller/tvlPoller.js';
import signalRoutes from './contagion-shield/src/api/routes/signals.js'; 
import dexScreenerClient from './src/api/dexScreenerClient.js';
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

    // --- MOUNT ROUTES FIRST ---
    app.use('/api/signals', signalRoutes);
    
    app.get('/api/stats', async (req, res) => {
      try {
        const stats = await db.getStats();
        res.json({
          protocols_monitored: MONITORED_PROTOCOLS.length,
          alerts_fired_today: stats.alertsCount,
          whale_moves_detected: stats.whaleCount,
          active_subscribers: stats.subCount
        });
      } catch (err) {
        res.status(500).json({ error: 'Failed' });
      }
    });

    app.get('/api/protocols/scores', async (req, res) => {
      try {
        const scores = await db.getAllLatestScores();
        const formatted = MONITORED_PROTOCOLS.map(p => {
          const s = scores.find(score => score.protocol_id === p.id);
          const trend = marketTrends[p.dexScreenerPair?.toLowerCase()] || {};
          
          return {
            id: p.id,
            name: p.name,
            chain: p.chain,
            dexScreenerPair: p.dexScreenerPair,
            dexScreenerChain: p.dexScreenerChain,
            score: s ? s.score : 0,
            alert_level: s ? s.alert_level : 'GREEN',
            tvl_usd: trend.liquidityUsd || (s ? s.tvlUsd : 0), 
            tvl_formatted: trend.liquidityUsd ? `\$${Math.round(trend.liquidityUsd / 1000000)}M` : '$--M',
            price_change_1h: trend.priceChange24h || 0, // Using 24h as stable proxy
            market_trends: {
              volume24h: trend.volume24h || 0,
              liquidity: trend.liquidityUsd || 0,
              priceChange24h: trend.priceChange24h || 0
            },
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
      } catch (err) {
        res.status(500).json({ error: 'Failed' });
      }
    });

    app.get('/api/feed', async (req, res) => {
      try {
        const qAlerts = await db.execute('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 30');
        const qWhales = await db.execute('SELECT * FROM canary_exits ORDER BY occurred_at DESC LIMIT 30');

        const events = [
          ...qAlerts.rows.map(a => ({
            id: `alert-${a.id}`,
            timestamp: a.created_at,
            time_ago: 'Recent',
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
            time_ago: 'Recent',
            protocol_name: MONITORED_PROTOCOLS.find(p => p.id === w.protocol_id)?.name || w.protocol_id,
            event_type: w.exit_type === 'exit' ? 'WHALE_ENTRY' : 'LP_DRAIN',
            badge_color: 'orange',
            title: w.exit_type === 'exit' ? 'Whale Entry Detected' : 'Smart Money Exit',
            description: `Wallet ${w.wallet_address?.substring(0, 10)} moved \$${Math.round(w.amount_usd || 0).toLocaleString()}`,
            wallet: w.wallet_address?.substring(0, 10),
            wallet_full: w.wallet_address,
            amount_usd: w.amount_usd,
            chain: 'eth'
          }))
        ];

        events.sort((a, b) => b.timestamp - a.timestamp);
        res.json({ events: events.slice(0, 50) });
      } catch (err) {
        res.status(500).json({ error: 'Failed' });
      }
    });

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', uptime: Math.floor((Date.now() - startTime) / 1000) });
    });

    const httpServer = createServer(app);
    const io = new SocketServer(httpServer, {
      cors: { origin: true, credentials: true }
    });

    // 1. Initialize DBs
    await initP1Db();
    await db.initPhase2Db();

    // 2. Start Data Pipeline
    liquidityHandler.init();
    swapHandler.init();
    priceHandler.init();
    await pairDiscoveryPoller.run();
    await tvlPoller.run();
    await wsManager.connect();
    await pollManager.start();

    // 3. Start Engines
    initWhaleDetector();
    initEcosystemReport();

    let latestScores = [];
    let marketTrends = {};

    const fetchTrends = async () => {
      try {
        const trends = await dexScreenerClient.fetchAllTrends(MONITORED_PROTOCOLS);
        marketTrends = trends;
        logger.info({ pairs: Object.keys(trends).length }, 'Market trends updated from DexScreener');
      } catch (err) {
        logger.error({ error: err.message }, 'Failed to update market trends');
      }
    };

    io.on('connection', (socket) => {
      if (latestScores.length > 0) {
        socket.emit('scores_update', { protocols: latestScores, timestamp: Date.now() });
      }
    });

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

    const runUnifiedPollCycle = async () => {
      const cycleScores = await runPollCycle();
      if (cycleScores && cycleScores.length > 0) {
        latestScores = cycleScores.map(s => {
            const pConfig = MONITORED_PROTOCOLS.find(p => p.id === s.protocolId);
            return {
                ...s,
                id: s.protocolId,
                name: s.protocolName,
                dexScreenerPair: pConfig?.dexScreenerPair,
                dexScreenerChain: pConfig?.dexScreenerChain,
                alert_level: s.alertLevel,
                tvl_usd: marketTrends[pConfig?.dexScreenerPair?.toLowerCase()]?.liquidityUsd || (s.tvlUsd || 0),
                tvl_formatted: marketTrends[pConfig?.dexScreenerPair?.toLowerCase()]?.liquidityUsd 
                    ? `\$${Math.round(marketTrends[pConfig?.dexScreenerPair?.toLowerCase()].liquidityUsd / 1000000)}M` 
                    : `\$${Math.round((s.tvlUsd || 0) / 1000000)}M`,
                price_change_1h: marketTrends[pConfig?.dexScreenerPair?.toLowerCase()]?.priceChange24h || s.priceChange1h || 0,
                market_trends: marketTrends[pConfig?.dexScreenerPair?.toLowerCase()] || null,
                signals: {
                tvl_velocity: { pts: s.signals.tvlVelocityPts, max: 25 },
                lp_drain: { pts: s.signals.lpDrainRatePts, max: 25 },
                depeg: { pts: s.signals.stablecoinDepegPts, max: 20 },
                smart_money: { pts: s.signals.smartMoneyExitPts, max: 20 },
                ave_risk: { pts: s.signals.aveRiskScorePts, max: 10 }
            }
          };
        });

        // Trigger Telegram alerts for critical changes (ORANGE/RED)
        cycleScores.forEach(async (s) => {
          if (s.alertLevel === 'ORANGE' || s.alertLevel === 'RED') {
            const icon = s.alertLevel === 'RED' ? '🔴' : '🟠';
            const message = `${icon} *ARGUS RISK ALERT: ${s.protocolName}*\n\n` + 
              `Risk Status: *${s.alertLevel}*\n` +
              `Contagion Score: *${s.score}/100*\n\n` +
              `⚠️ High priority on-chain movement detected. Check the intelligence dashboard for details.\n\n` +
              `[View Analysis Map](https://argus-frontend-two.vercel.app/dashboard)`;
            
            await telegramBot.broadcastAlert(message);

            // Also emit to the dashboard feed
            io.emit('feed_update', {
              events: [{
                id: `alert-${s.protocolId}-${Date.now()}`,
                timestamp: Date.now(),
                time_ago: 'Just now',
                protocol_name: s.protocolName,
                event_type: 'RISK_ESCALATION',
                badge_color: s.alertLevel === 'RED' ? 'red' : 'orange',
                title: 'Risk Escalation',
                description: `Critical alert: Health score dropped to ${s.score}/100`,
                chain: s.chain
              }]
            });
          }
        });

        io.emit('scores_update', { protocols: latestScores, timestamp: Date.now() });
        const stats = await db.getStats();
        io.emit('stats_update', {
            protocols_monitored: MONITORED_PROTOCOLS.length,
            alerts_fired_today: stats.alertsCount,
            whale_moves_detected: stats.whaleCount,
            active_subscribers: stats.subCount
        });
      }
    };

    setTimeout(() => {
        runUnifiedPollCycle().catch(e => logger.error({error: e.message}, 'Initial poll failed'));
    }, 2000);
    
    setInterval(runUnifiedPollCycle, 60 * 1000);

    // Initial and periodic trend fetch (every 5 mins)
    fetchTrends();
    setInterval(fetchTrends, 5 * 60 * 1000);

    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`🛡️  ARGUS Unified Server: http://0.0.0.0:${PORT}`);
    });

  } catch (err) {
    logger.error({ error: err.stack }, 'FATAL: Server failed to boot');
    process.exit(1);
  }
}

bootstrap();

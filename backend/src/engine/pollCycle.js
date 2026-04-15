/**
 * Poll Cycle - Orchestrates the 60s risk evaluation loop.
 * Each signal is wrapped in its own try/catch so a single failure
 * doesn't kill the entire cycle.
 */
import { MONITORED_PROTOCOLS } from '../config/protocols.js';
import { computeTvlVelocity } from './signals/tvlVelocity.js';
import { computeLpDrainRate } from './signals/lpDrainRate.js';
import { computeStablecoinDepeg } from './signals/stablecoinDepeg.js';
import { computeSmartMoneyExit, scanForCanaryExits } from './signals/smartMoneyExit.js';
import { computeAveRiskScore } from './signals/aveRiskScore.js';
import { aggregateScore, applyContagionMultiplier } from './contagionScore.js';
import { evaluateAlerts } from './alertEvaluator.js';
import socketServer from '../broadcast/socketServer.js';
import db from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('engine/poll-cycle');

// Default signal result for failed signals
const EMPTY_SIGNAL = { pts: 0, skipped: true, error: 'signal_failed' };

/**
 * Safely runs a signal computation — returns EMPTY_SIGNAL on error.
 */
async function safeSignal(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    logger.debug({ signal: name, pts: result.pts, ms: Date.now() - start }, 'Signal computed');
    return result;
  } catch (error) {
    logger.error({ signal: name, error: error.message, ms: Date.now() - start }, 'Signal FAILED');
    return EMPTY_SIGNAL;
  }
}

/**
 * Runs a single evaluation cycle for all protocols.
 */
export async function runPollCycle() {
  const startTime = Date.now();
  logger.info('Starting risk evaluation cycle...');

  try {
    const protocolScores = [];

    for (const protocol of MONITORED_PROTOCOLS) {
      const { id, chain, tokenId, pairId, stablecoinTokenIds } = protocol;
      
      const tokenAddress = tokenId.split('-')[0];
      const pairAddress = pairId.split('-')[0];

      // 1. Pre-scan for canary exits (non-critical — wrap in try/catch)
      try {
        await scanForCanaryExits(chain, id, pairAddress);
      } catch (err) {
        logger.warn({ protocolId: id, error: err.message }, 'Canary exit scan failed (non-critical)');
      }

      // 2. Compute individual signals — each in its own safe wrapper
      const [tvl, lp, smartMoney, aveRisk] = await Promise.all([
        safeSignal('tvlVelocity', () => computeTvlVelocity(chain, tokenAddress)),
        safeSignal('lpDrainRate', () => computeLpDrainRate(chain, pairAddress)),
        safeSignal('smartMoneyExit', () => computeSmartMoneyExit(chain, id, pairAddress)),
        safeSignal('aveRiskScore', () => computeAveRiskScore(chain, id, tokenAddress))
      ]);

      // 3. Special handling for Stablecoin Depeg (Signal 3)
      let worstDepeg = { pts: 0, depegPct: 0, skipped: true };
      if (stablecoinTokenIds && stablecoinTokenIds.length > 0) {
        try {
          const depegResults = await Promise.all(
            stablecoinTokenIds.map(sid => 
              safeSignal('stablecoinDepeg', () => computeStablecoinDepeg(chain, sid.split('-')[0]))
            )
          );
          worstDepeg = depegResults.reduce((worst, current) => 
            (current.pts > worst.pts) ? current : worst, { pts: 0 }
          );
        } catch (err) {
          logger.warn({ protocolId: id, error: err.message }, 'Depeg computation failed');
        }
      }

      // 4. Aggregate Score
      const aggregated = aggregateScore({
        tvl, lp, depeg: worstDepeg, smartMoney, aveRisk
      });

      protocolScores.push({
        ...aggregated,
        protocolId: id,
        protocolName: protocol.name,
        chain,
        tvlUsd: tvl.currentTvl || 0,
        priceChange1h: tvl.priceChange1h || 0
      });
    }

    // 5. Apply Contagion Multiplier
    const finalScores = applyContagionMultiplier(protocolScores);

    // 6. Persist results and evaluate alerts
    for (const protocolScore of finalScores) {
      const protocol = MONITORED_PROTOCOLS.find(p => p.id === protocolScore.protocolId);
      
      // Persist to DB
      try {
        await _saveScore(protocolScore);
      } catch (err) {
        logger.error({ protocolId: protocolScore.protocolId, error: err.message }, 'Failed to save score');
      }

      // Trigger alerts
      try {
        await evaluateAlerts(protocol, protocolScore);
      } catch (err) {
        logger.error({ protocolId: protocolScore.protocolId, error: err.message }, 'Alert evaluation failed');
      }
    }

    // 7. Broadcast to Dashboard
    socketServer.broadcastScores(finalScores);

    const duration = Date.now() - startTime;
    const summary = finalScores.map(s => `${s.protocolName}: ${s.score} ${s.alertLevel}`).join(' | ');
    logger.info({ duration_ms: duration }, `Poll cycle complete | ${summary}`);

    return finalScores;

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'CRITICAL ERROR in poll cycle');
    return [];
  }
}

async function _saveScore(s) {
  await db.execute({
    sql: `INSERT INTO scores (
      protocol_id, score, alert_level, 
      signal_tvl_pts, signal_lp_pts, signal_depeg_pts, 
      signal_smart_money_pts, signal_ave_risk_pts, 
      contagion_multiplier_applied, low_confidence, computed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      s.protocolId, s.score, s.alertLevel,
      s.signals.tvlVelocityPts, s.signals.lpDrainRatePts, s.signals.stablecoinDepegPts,
      s.signals.smartMoneyExitPts, s.signals.aveRiskScorePts,
      s.contagionMultiplierApplied ? 1 : 0, s.lowConfidence ? 1 : 0, Date.now()
    ]
  });
}

export default { runPollCycle };

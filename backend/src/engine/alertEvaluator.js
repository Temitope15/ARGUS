/**
 * Alert Evaluator - Detects score changes and triggers alert broadcasts/notifications.
 */
import db from '../database/phase2Db.js';
import { broadcastAlert } from '../alerts/telegramBot.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('engine/alert-evaluator');

/**
 * Evaluates the new score against the previous one and fires alerts.
 */
export async function evaluateAlerts(protocol, newScoreObj) {
  try {
    const protocolId = protocol.id;
    const { score, alertLevel, contagionMultiplierApplied } = newScoreObj;

    // 1. Get last alert status for this protocol from DB
    const result = await db.execute({
      sql: `SELECT * FROM scores 
            WHERE protocol_id = ? 
            AND id < (SELECT MAX(id) FROM scores WHERE protocol_id = ?)
            ORDER BY computed_at DESC LIMIT 1`,
      args: [protocolId, protocolId]
    });
    const lastScoreResult = result.rows[0];

    const prevLevel = lastScoreResult ? lastScoreResult.alert_level : 'GREEN';
    const prevScore = lastScoreResult ? lastScoreResult.score : 0;
    const prevContagion = lastScoreResult ? !!lastScoreResult.contagion_multiplier_applied : false;

    // 2. Determine if we should broadcast
    let broadcastType = null;
    let message = null;

    if (levelRank[alertLevel] > levelRank[prevLevel]) {
      broadcastType = 'escalation';
      const colorIcon = alertLevel === 'RED' ? '🔴' : (alertLevel === 'ORANGE' ? '🟠' : '🟡');
      message = `${colorIcon} *${alertLevel} — ${protocol.name} (${protocol.chain.toUpperCase()})*\n` +
                `Score just crossed into ${alertLevel}: ${score}/100\n\n` +
                `*What's happening:*\n` +
                await buildSignalDetail(newScoreObj.signals) +
                `\n\n_Watch closely. /status for details._`;
    } else if (prevLevel !== 'GREEN' && alertLevel === 'GREEN') {
      broadcastType = 'resolved';
      message = `✅ *RESOLVED — ${protocol.name} (${protocol.chain.toUpperCase()})*\n\n` +
                `Score returned to safe zone: ${score}/100 🟢\n\n` +
                `The earlier warning signals have normalized.\n` +
                `TVL has stabilized, LP activity returned to baseline.`;
    } else if (contagionMultiplierApplied && !prevContagion) {
      broadcastType = 'contagion';
      message = `⚡ *CONTAGION SIGNAL ACTIVE*\n\n` +
                `Systemic stress detected across multiple protocols including *${protocol.name}*.\n` +
                `The risk multiplier has been applied. Stay alert.`;
    }

    if (broadcastType && message) {
      logger.info({ protocolId, type: broadcastType }, 'Triggering alert broadcast');
      await broadcastAlert(message);
      
      // Record this broadcast in alerts table
      await db.execute({
        sql: `INSERT INTO alerts (protocol_id, alert_level, score, message, created_at, telegram_sent)
              VALUES (?, ?, ?, ?, ?, 1)`,
        args: [protocolId, alertLevel, score, message, Date.now()]
      });
    }

  } catch (error) {
    logger.error({ error: error.message, protocol: protocol.id }, 'Alert evaluation failed');
  }
}

const levelRank = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 };

async function buildSignalDetail(signals) {
  let detail = "";
  if (signals.tvlVelocityPts > 0) detail += `• TVL Velocity: ${signals.tvlVelocityPts} pts\n`;
  if (signals.lpDrainRatePts > 0) detail += `• LP Drain: ${signals.lpDrainRatePts} pts\n`;
  if (signals.stablecoinDepegPts > 0) detail += `• Depeg risk detected\n`;
  if (signals.smartMoneyExitPts > 0) detail += `• Smart money movement detected\n`;
  if (signals.aveRiskScorePts > 0) detail += `• AVE Risk Engine signal\n`;
  
  return detail || "• Minor volatility detected";
}

export default { evaluateAlerts };

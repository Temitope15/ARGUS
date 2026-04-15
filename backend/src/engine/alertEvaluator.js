/**
 * Alert Evaluator - Detects score changes and triggers alert broadcasts/notifications.
 */
import db from '../database/phase2Db.js';
import telegramBot from '../alerts/telegramBot.js';
import tradeExecutor from './tradeExecutor.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('engine/alert-evaluator');

/**
 * Evaluates the new score against the previous one and fires alerts.
 */
export async function evaluateAlerts(protocol, newScoreObj) {
  try {
    const protocolId = protocol.id;
    const { score, alertLevel, lowConfidence, contagionMultiplierApplied } = newScoreObj;

    // 1. Get last alert status for this protocol
    const result = await db.execute({
      sql: `SELECT * FROM alerts 
            WHERE protocol_id = ? 
            ORDER BY created_at DESC LIMIT 1`,
      args: [protocolId]
    });
    const lastAlert = result.rows[0];

    const prevLevel = lastAlert ? lastAlert.alert_level : 'GREEN';
    const prevScore = lastAlert ? lastAlert.score : 0;

    // 2. Logic to decide if we send a NEW message, EDIT an existing one, or ignore
    let action = 'IGNORE';
    
    if (alertLevel !== prevLevel) {
      if (isEscalation(prevLevel, alertLevel)) {
        action = 'SEND_NEW';
      } else if (isDowngrade(prevLevel, alertLevel)) {
        action = 'SEND_RESOLVED';
      }
    } else if (Math.abs(score - prevScore) >= 10 && alertLevel !== 'GREEN') {
      // Significant score change within same level
      action = 'EDIT_EXISTING';
    }

    // Rate limiting: max 1 message/edit per 5 minutes per protocol (except escalation)
    const fiveMinsAgo = Date.now() - (5 * 60 * 1000);
    if (action !== 'SEND_NEW' && lastAlert && lastAlert.created_at > fiveMinsAgo) {
      action = 'IGNORE';
    }

    if (action === 'IGNORE') return;

    // 3. Execute alert action
    const messageData = {
      protocolName: protocol.name,
      chain: protocol.chain,
      score,
      alertLevel,
      previousLevel: prevLevel,
      contagionMultiplierApplied,
      signalResults: newScoreObj.signals
    };

    if (action === 'SEND_NEW') {
      let tradeResult = null;
      if (alertLevel === 'RED') {
        const mode = process.env.AUTO_PROTECT_MODE || 'FULL_EXIT'; // Configurable user setting
        const mockUserWallet = process.env.PROTECTED_WALLET || '0xDemoWalletAddress00000000000000';
        tradeResult = await tradeExecutor.executeProtection(protocol, mode, mockUserWallet);
        if (tradeResult && tradeResult.success) {
           messageData.tradeAction = `Auto-Protection (${mode}) Engaged. Sim Tx: ${tradeResult.receipt.transactionHash.substring(0,10)}...`;
        }
      }

      const messageId = await telegramBot.sendAlert(messageData);
      await _recordAlert(protocolId, alertLevel, score, logMessage, messageId);
    } else if (action === 'EDIT_EXISTING' && lastAlert?.telegram_message_id) {
      await telegramBot.editAlert(lastAlert.telegram_message_id, messageData);
      await _recordAlert(protocolId, alertLevel, score, 'Score update (Edit)', lastAlert.telegram_message_id);
    } else if (action === 'SEND_RESOLVED') {
      await telegramBot.sendResolved(messageData);
      await _recordAlert(protocolId, alertLevel, score, 'Risk resolved/downgraded', null);
    }

  } catch (error) {
    logger.error({ error: error.message, protocol: protocol.id }, 'Alert evaluation failed');
  }
}

function isEscalation(oldLevel, newLevel) {
  const levels = ['GREEN', 'YELLOW', 'ORANGE', 'RED'];
  return levels.indexOf(newLevel) > levels.indexOf(oldLevel);
}

function isDowngrade(oldLevel, newLevel) {
  const levels = ['GREEN', 'YELLOW', 'ORANGE', 'RED'];
  return levels.indexOf(newLevel) < levels.indexOf(oldLevel);
}

async function _recordAlert(protocolId, level, score, msg, tgId) {
  await db.execute({
    sql: `INSERT INTO alerts (protocol_id, alert_level, score, message, telegram_message_id, telegram_sent, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [protocolId, level, score, msg, tgId, tgId ? 1 : 0, Date.now()]
  });
}

export default { evaluateAlerts };

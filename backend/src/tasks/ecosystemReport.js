/**
 * Ecosystem Report - Sends periodic risk summary to all subscribers via Telegram.
 * Runs every 30 minutes.
 */
import * as db from '../database/phase2Db.js';
import { broadcastAlert } from '../alerts/telegramBot.js';
import { MONITORED_PROTOCOLS } from '../config/protocols.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('tasks/ecosystem-report');

const REPORT_INTERVAL_MS = (parseInt(process.env.REPORT_INTERVAL_MINUTES) || 30) * 60 * 1000;

let reportTimer = null;

/**
 * Initialize the ecosystem report scheduler.
 */
export function initEcosystemReport() {
  reportTimer = setInterval(sendEcosystemReports, REPORT_INTERVAL_MS);
  logger.info({ intervalMs: REPORT_INTERVAL_MS }, 'Ecosystem report scheduler started');
}

/**
 * Stop the scheduler.
 */
export function stopEcosystemReport() {
  if (reportTimer) clearInterval(reportTimer);
}

/**
 * Sends ecosystem reports to all subscribers.
 */
export async function sendEcosystemReports() {
  try {
    const scores = await db.getAllLatestScores();
    const stats = await db.getStats();

    const message = formatEcosystemReport(scores, stats);

    await broadcastAlert(message, {
      reply_markup: {
        inline_keyboard: [[
          { text: '📊 Open Dashboard', url: `${process.env.RENDER_URL || process.env.FRONTEND_URL || 'https://argus-shield.com'}/dashboard` }
        ]]
      }
    });

    logger.info('Ecosystem reports sent to all subscribers');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to send ecosystem reports');
  }
}

function formatEcosystemReport(scores, stats) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' });

  const emojiMap = { GREEN: '🟢', YELLOW: '🟡', ORANGE: '🟠', RED: '🔴' };

  let report = `📡 *ARGUS Report — ${timeStr}*\n\n`;

  let activeAlerts = false;
  for (const protocol of MONITORED_PROTOCOLS) {
    const s = scores.find(score => score.protocol_id === protocol.id);
    if (s) {
      const e = emojiMap[s.alert_level] || '❓';
      const warning = s.score > 30 ? ' ← watch this' : '';
      report += `${e} *${protocol.name}* — ${s.score}/100${warning}\n`;
      if (s.alert_level !== 'GREEN') activeAlerts = true;
    } else {
      report += `⚪ *${protocol.name}* — Pending poll...\n`;
    }
  }

  report += `\n${activeAlerts ? '⚠️ *Active risks detected.*' : '*No active alerts.* All protocols within normal range.'}\n\n`;
  report += `Monitoring ${MONITORED_PROTOCOLS.length} protocols | ${stats.whaleCount} whale moves today`;

  return report;
}

export default { initEcosystemReport, stopEcosystemReport, sendEcosystemReports };

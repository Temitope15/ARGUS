/**
 * Ecosystem Report - Sends periodic portfolio + risk summary to users via Telegram.
 * Runs every 30 minutes.
 */
import {
  getUsersWithTelegram, getAllLatestScores,
  getUserPortfolioValue, getPositions, getWallets
} from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('tasks/ecosystem-report');

const REPORT_INTERVAL_MS = (parseInt(process.env.REPORT_INTERVAL_MINUTES) || 30) * 60 * 1000;

let reportTimer = null;
let telegramBot = null;

/**
 * Initialize the ecosystem report scheduler.
 */
export function initEcosystemReport(bot) {
  telegramBot = bot;
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
 * Sends ecosystem reports to all eligible users.
 */
export async function sendEcosystemReports() {
  try {
    if (!telegramBot || !telegramBot.bot) return;

    const users = await getUsersWithTelegram();
    const scores = await getAllLatestScores();

    for (const user of users) {
      try {
        const wallets = await getWallets(user.id);
        if (!wallets || wallets.length === 0) continue;
        
        const portfolio = await getUserPortfolioValue(user.id);
        if (portfolio.totalValueUsd < 1) continue;

        const openPositions = await getPositions(user.id, 'open');
        const message = formatEcosystemReport(user, scores, portfolio, openPositions);

        await telegramBot.bot.sendMessage(user.telegram_id, message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '📊 Open Dashboard', url: `${process.env.FRONTEND_URL || 'https://argus-backend-tkgz.onrender.com'}/dashboard` }
            ]]
          }
        });
      } catch (userErr) {
        logger.warn({ telegramId: user.telegram_id, error: userErr.message }, 'Failed to send report to user');
      }
    }

    logger.info({ userCount: users.length }, 'Ecosystem reports sent');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to send ecosystem reports');
  }
}

function formatEcosystemReport(user, scores, portfolio, openPositions) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const emoji = { GREEN: '🟢', YELLOW: '🟡', ORANGE: '🟠', RED: '🔴' };

  let report = `📡 *ARGUS Report — ${timeStr}*\n\n`;

  // Protocol scores
  for (const s of scores) {
    const e = emoji[s.alert_level] || '❓';
    const note = s.alert_level === 'RED' ? ' ⚡ CONTAGION ACTIVE' : '';
    report += `${e} *${s.protocol_id}*: ${s.score}/100 — ${s.alert_level}${note}\n`;
  }

  // Portfolio summary
  const pnlSign = portfolio.totalPnlUsd >= 0 ? '+' : '';
  const pnlEmoji = portfolio.totalPnlUsd >= 0 ? '📈' : '📉';

  report += `\nYour portfolio: $${portfolio.totalValueUsd.toFixed(2)} | `;
  report += `P&L: ${pnlSign}$${portfolio.totalPnlUsd.toFixed(2)} (${pnlSign}${portfolio.totalPnlPct.toFixed(1)}%) ${pnlEmoji}\n`;

  // Open positions
  if (openPositions.length > 0) {
    report += `\nOpen positions: ${openPositions.length}\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const pos of openPositions.slice(0, 5)) {
      const posSign = pos.pnl_usd >= 0 ? '+' : '';
      const posEmoji = pos.pnl_usd >= 0 ? '📈' : '📉';
      report += `${pos.to_asset}: ${posSign}$${pos.pnl_usd.toFixed(2)} (${posSign}${pos.pnl_pct.toFixed(1)}%) ${posEmoji}\n`;
    }
  }

  return report;
}

export default { initEcosystemReport, stopEcosystemReport, sendEcosystemReports };

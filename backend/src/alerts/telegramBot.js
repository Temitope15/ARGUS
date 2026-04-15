import TelegramBot from 'node-telegram-bot-api';
import * as db from '../database/phase2Db.js';
import { MONITORED_PROTOCOLS } from '../config/protocols.js';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Handle polling errors (like 409 Conflict during Render deployments)
let lastErrorCode = null;
bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
    if (lastErrorCode !== 409) {
      console.log('📡 Telegram Bot: 409 Conflict detected (usually secondary instance during deployment). Intelligence polling continues...');
      lastErrorCode = 409;
    }
  } else {
    console.error('📡 Telegram Polling Error:', error.message);
  }
});

// Helper to get protocol list text
async function getProtocolListText() {
  return MONITORED_PROTOCOLS.map(p => `• ${p.name} (${p.chain.toUpperCase()})`).join('\n');
}

// Helper to build status report
async function buildStatusReport() {
  const scores = await db.getAllLatestScores();
  if (!scores || scores.length === 0) return "📡 *ARGUS Snapshot*\n\nNo data available yet. Monitoring in progress...";
  
  let report = "📡 *ARGUS Status Report*\n\n";
  for (const protocol of MONITORED_PROTOCOLS) {
    const scoreData = scores.find(s => s.protocol_id === protocol.id);
    if (scoreData) {
      const icon = scoreData.score <= 20 ? '🟢' : (scoreData.score <= 45 ? '🟡' : (scoreData.score <= 70 ? '🟠' : '🔴'));
      report += `${icon} *${protocol.name}* — ${scoreData.score}/100\n`;
    } else {
      report += `⚪ *${protocol.name}* — Pending poll...\n`;
    }
  }
  
  report += `\n_Monitoring ${MONITORED_PROTOCOLS.length} protocols | /help for commands_`;
  return report;
}

// ─── /start command ─────────────────────────────────────────────
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'there';
  const username = msg.from.username || null;
  
  try {
    // Add to subscribers table
    await db.upsertSubscriber({
      chat_id: chatId.toString(),
      username: username,
      first_name: firstName,
      subscribed_at: Math.floor(Date.now() / 1000)
    });
    
    const protocolList = await getProtocolListText();
    
    await bot.sendMessage(chatId, 
      `👁 *Welcome to ARGUS, ${firstName}.*\n\n` +
      `I monitor DeFi pools 24/7 — tracking whale movements, liquidity drains, ` +
      `and stablecoin stability across the major protocols.\n\n` +
      `*You'll hear from me when something matters.*\n\n` +
      `Right now I'm watching:\n${protocolList}` +
      `\n\n_Type /status for a live snapshot. Type /stop to unsubscribe._`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Error in /start:', err);
  }
});

// ─── /status command — on-demand report ─────────────────────────
bot.onText(/\/status/, async (msg) => {
  try {
    const report = await buildStatusReport();
    await bot.sendMessage(msg.chat.id, report, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Error in /status:', err);
  }
});

// ─── /stop command ───────────────────────────────────────────────
bot.onText(/\/stop/, async (msg) => {
  try {
    await db.removeSubscriber(msg.chat.id.toString());
    await bot.sendMessage(msg.chat.id, 
      `You've been unsubscribed from ARGUS alerts.\n` +
      `Send /start anytime to re-subscribe.`
    );
  } catch (err) {
    console.error('Error in /stop:', err);
  }
});

// ─── /help command ───────────────────────────────────────────────
bot.onText(/\/help/, async (msg) => {
  await bot.sendMessage(msg.chat.id,
    `*ARGUS Commands*\n\n` +
    `/start — Subscribe to alerts\n` +
    `/status — See current protocol scores\n` +
    `/stop — Unsubscribe\n` +
    `/help — This message`,
    { parse_mode: 'Markdown' }
  );
});

// ─── Broadcast to all subscribers ────────────────────────────────
export async function broadcastAlert(message, options = {}) {
  const subscribers = await db.getAllSubscribers();
  const results = { sent: 0, failed: 0 };
  
  for (const sub of subscribers) {
    try {
      await bot.sendMessage(sub.chat_id, message, { 
        parse_mode: 'Markdown', 
        ...options 
      });
      results.sent++;
      // Small delay to respect Telegram rate limits (30 msgs/sec)
      await new Promise(r => setTimeout(r, 50));
    } catch (err) {
      // If user blocked the bot, remove them
      if (err.code === 'ETELEGRAM' && err.response?.body?.error_code === 403) {
        await db.removeSubscriber(sub.chat_id);
      }
      results.failed++;
    }
  }
  
  return results;
}

export default { bot, broadcastAlert };

/**
 * Telegram Bot - Real-time DeFi risk alerts via @Argus_shield_bot.
 * 
 * Users just open the bot and type /start — zero signup.
 * Bot auto-registers their chat ID and starts sending alerts.
 * 
 * Commands:
 *   /start  — Register for alerts
 *   /status — Get current scores for all protocols
 *   /help   — Show available commands
 */
import TelegramBot from 'node-telegram-bot-api';
import alertTemplates from './alertTemplates.js';
import db from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('alerts/telegram-bot');

class ArgusTelegramBot {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.adminChatId = process.env.TELEGRAM_CHAT_ID; // Admin/default channel
    this.subscribedChats = new Set();
    this.bot = null;
  }

  /**
   * Initialize the bot — must be called after env vars are loaded.
   */
  init() {
    if (!this.token) {
      logger.warn('TELEGRAM_BOT_TOKEN missing. Alerts will be logged only.');
      return;
    }

    this.bot = new TelegramBot(this.token, { polling: true });
    
    // Load admin chat
    if (this.adminChatId) {
      this.subscribedChats.add(this.adminChatId);
    }

    // Load previously subscribed chats from DB
    this._loadSubscribers();

    // Register command handlers
    this.bot.onText(/\/start/, (msg) => this._handleStart(msg));
    this.bot.onText(/\/status/, (msg) => this._handleStatus(msg));
    this.bot.onText(/\/help/, (msg) => this._handleHelp(msg));
    this.bot.onText(/\/stop/, (msg) => this._handleStop(msg));

    this.bot.on('polling_error', (error) => {
      logger.warn({ error: error.message }, 'Telegram polling error');
    });

    logger.info({ adminChat: this.adminChatId, subscribers: this.subscribedChats.size }, 
      'Telegram bot initialized with polling');
  }

  _loadSubscribers() {
    try {
      // Create subscribers table if not exists
      db.exec(`
        CREATE TABLE IF NOT EXISTS telegram_subscribers (
          chat_id TEXT PRIMARY KEY,
          username TEXT,
          subscribed_at INTEGER NOT NULL
        )
      `);

      const subs = db.prepare('SELECT chat_id FROM telegram_subscribers').all();
      for (const s of subs) {
        this.subscribedChats.add(s.chat_id);
      }
    } catch (err) {
      logger.warn({ error: err.message }, 'Could not load subscribers');
    }
  }

  async _handleStart(msg) {
    const chatId = msg.chat.id.toString();
    const username = msg.from?.username || msg.from?.first_name || 'Unknown';

    this.subscribedChats.add(chatId);

    // Persist subscriber
    try {
      db.prepare(`
        INSERT OR REPLACE INTO telegram_subscribers (chat_id, username, subscribed_at)
        VALUES (?, ?, ?)
      `).run(chatId, username, Date.now());
    } catch (err) {
      logger.warn({ error: err.message }, 'Could not persist subscriber');
    }

    const welcome = `🛡️ *Welcome to ARGUS Contagion Shield*

You're now subscribed to real-time DeFi risk alerts.

ARGUS monitors multiple protocols 24/7 and will alert you when:
🟡 *YELLOW* (Score ≥21) — Watch closely
🟠 *ORANGE* (Score ≥46) — Consider reducing exposure
🔴 *RED* (Score ≥71) — Immediate action recommended
✅ *GREEN* — All clear

*Commands:*
/status — Current risk scores
/help — Available commands
/stop — Unsubscribe from alerts

_ARGUS never sleeps. Your money shouldn't either._`;

    await this.bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });
    logger.info({ chatId, username }, 'New subscriber registered');
  }

  async _handleStatus(msg) {
    const chatId = msg.chat.id.toString();

    try {
      // Get latest scores from DB
      const scores = db.prepare(`
        SELECT s1.* FROM scores s1
        INNER JOIN (
          SELECT protocol_id, MAX(computed_at) as max_at
          FROM scores GROUP BY protocol_id
        ) s2 ON s1.protocol_id = s2.protocol_id AND s1.computed_at = s2.max_at
      `).all();

      if (scores.length === 0) {
        await this.bot.sendMessage(chatId, '⏳ No scores computed yet. Engine is starting up...');
        return;
      }

      const emoji = { GREEN: '✅', YELLOW: '🟡', ORANGE: '🟠', RED: '🔴' };

      let statusMsg = '🛡️ *ARGUS — Current Risk Status*\n\n';

      for (const s of scores) {
        const e = emoji[s.alert_level] || '❓';
        const age = Math.round((Date.now() - s.computed_at) / 1000);
        statusMsg += `${e} *${s.protocol_id}*\n`;
        statusMsg += `   Score: ${s.score}/100 — ${s.alert_level}\n`;
        statusMsg += `   TVL: ${s.signal_tvl_pts}  LP: ${s.signal_lp_pts}  Depeg: ${s.signal_depeg_pts}  SM: ${s.signal_smart_money_pts}  Risk: ${s.signal_ave_risk_pts}\n`;
        statusMsg += `   _${age}s ago_\n\n`;
      }

      statusMsg += '_Type /help for more commands_';

      await this.bot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to send status');
      await this.bot.sendMessage(chatId, '❌ Error fetching scores. Try again soon.');
    }
  }

  async _handleHelp(msg) {
    const chatId = msg.chat.id.toString();
    const helpText = `🛡️ *ARGUS Shield Commands*

/start — Subscribe to risk alerts
/status — View current protocol risk scores
/stop — Unsubscribe from alerts
/help — Show this message

*Alert Levels:*
✅ GREEN (0-20) — All clear
🟡 YELLOW (21-45) — Monitor closely
🟠 ORANGE (46-70) — Consider action
🔴 RED (71-100) — Immediate action needed

_Alerts are sent automatically when scores change._`;

    await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  async _handleStop(msg) {
    const chatId = msg.chat.id.toString();
    this.subscribedChats.delete(chatId);

    try {
      db.prepare('DELETE FROM telegram_subscribers WHERE chat_id = ?').run(chatId);
    } catch (err) {
      logger.warn({ error: err.message }, 'Could not remove subscriber');
    }

    await this.bot.sendMessage(chatId, '👋 Unsubscribed from ARGUS alerts. Type /start to re-subscribe.');
    logger.info({ chatId }, 'Subscriber removed');
  }

  /**
   * Sends a new alert message to ALL subscribers.
   */
  async sendAlert(data) {
    if (!this.bot) return null;

    const text = alertTemplates.getTemplate(data.alertLevel, data);
    let firstMessageId = null;

    for (const chatId of this.subscribedChats) {
      try {
        const msg = await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        if (!firstMessageId) firstMessageId = msg.message_id.toString();
        logger.debug({ chatId, protocol: data.protocolName }, 'Alert sent');
      } catch (error) {
        logger.warn({ chatId, error: error.message }, 'Failed to send alert to subscriber');
        // If chat is invalid (blocked/deleted), remove from subscribers
        if (error.message.includes('chat not found') || error.message.includes('blocked')) {
          this.subscribedChats.delete(chatId);
        }
      }
    }

    return firstMessageId;
  }

  /**
   * Edits an existing alert message (admin chat only).
   */
  async editAlert(messageId, data) {
    if (!this.bot || !this.adminChatId) return;

    try {
      const text = alertTemplates.getTemplate(data.alertLevel, data);
      await this.bot.editMessageText(text, {
        chat_id: this.adminChatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });
      logger.debug({ messageId }, 'Alert edited');
    } catch (error) {
      if (!error.message.includes('message is not modified')) {
        logger.warn({ error: error.message }, 'Failed to edit alert');
      }
    }
  }

  /**
   * Sends a resolution message to ALL subscribers.
   */
  async sendResolved(data) {
    if (!this.bot) return;

    const text = alertTemplates.getTemplate('GREEN', data);
    for (const chatId of this.subscribedChats) {
      try {
        await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      } catch (error) {
        logger.warn({ chatId, error: error.message }, 'Failed to send resolution');
      }
    }
  }

  /**
   * Graceful shutdown — stop polling.
   */
  shutdown() {
    if (this.bot) {
      this.bot.stopPolling();
    }
  }
}

export default new ArgusTelegramBot();

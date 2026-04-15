/**
 * Telegram Bot - Real-time DeFi risk alerts + paper trading interactions.
 * 
 * Phase 2 commands: /start, /status, /help, /stop
 * Phase 3 commands: /portfolio, /positions, /report, /settings
 * Phase 3 interactions: inline buttons for suggestions, position management
 */
import TelegramBot from 'node-telegram-bot-api';
import alertTemplates from './alertTemplates.js';
import db, {
  getUserByTelegramId, getWallets, getPositions,
  getUserPortfolioValue, getAllLatestScores,
  getUserSession, setUserSession, clearUserSession,
  getSuggestion, updateSuggestion, updateUserSettings,
  closePosition as dbClosePosition, getPosition, getWallet, updateWallet
} from '../database/phase2Db.js';
import { executePaperTrade } from '../trading/executor.js';
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
  async init() {
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
    await this._loadSubscribers();

    // Register command handlers
    this.bot.onText(/\/start/, (msg) => this._handleStart(msg));
    this.bot.onText(/\/status/, (msg) => this._handleStatus(msg));
    this.bot.onText(/\/help/, (msg) => this._handleHelp(msg));
    this.bot.onText(/\/stop/, (msg) => this._handleStop(msg));
    
    // Phase 3 commands
    this.bot.onText(/\/portfolio/, (msg) => this._handlePortfolio(msg));
    this.bot.onText(/\/positions/, (msg) => this._handlePositions(msg));
    this.bot.onText(/\/report/, (msg) => this._handleReport(msg));
    this.bot.onText(/\/settings/, (msg) => this._handleSettings(msg));

    // Callback query handler (inline button presses)
    this.bot.on('callback_query', (query) => this._handleCallbackQuery(query));

    // Message handler (for edit amount flow)
    this.bot.on('message', (msg) => this._handleMessage(msg));

    this.bot.on('polling_error', (error) => {
      logger.warn({ error: error.message }, 'Telegram polling error');
    });

    logger.info({ adminChat: this.adminChatId, subscribers: this.subscribedChats.size }, 
      'Telegram bot initialized with polling');
  }

  async _loadSubscribers() {
    try {
      // Create subscribers table if not exists
      await db.execute(`
        CREATE TABLE IF NOT EXISTS telegram_subscribers (
          chat_id TEXT PRIMARY KEY,
          username TEXT,
          subscribed_at INTEGER NOT NULL
        )
      `);

      const res = await db.execute('SELECT chat_id FROM telegram_subscribers');
      for (const s of res.rows) {
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
      await db.execute({
        sql: `INSERT INTO telegram_subscribers (chat_id, username, subscribed_at)
              VALUES (?, ?, ?)
              ON CONFLICT(chat_id) DO UPDATE SET 
              username=excluded.username, subscribed_at=excluded.subscribed_at`,
        args: [chatId, username, Date.now()]
      });
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
/portfolio — Your simulated portfolio
/positions — Open positions & P&L
/report — On-demand ecosystem report
/settings — Risk settings & auto-trade
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
      const result = await db.execute(`
        SELECT s1.* FROM scores s1
        INNER JOIN (
          SELECT protocol_id, MAX(computed_at) as max_at
          FROM scores GROUP BY protocol_id
        ) s2 ON s1.protocol_id = s2.protocol_id AND s1.computed_at = s2.max_at
      `);
      const scores = result.rows;

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
/portfolio — Your simulated portfolio overview
/positions — Open positions with live P&L
/report — On-demand ecosystem report
/settings — Change risk tolerance & auto-trade
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
      await db.execute({ sql: 'DELETE FROM telegram_subscribers WHERE chat_id = ?', args: [chatId] });
    } catch (err) {
      logger.warn({ error: err.message }, 'Could not remove subscriber');
    }

    await this.bot.sendMessage(chatId, '👋 Unsubscribed from ARGUS alerts. Type /start to re-subscribe.');
    logger.info({ chatId }, 'Subscriber removed');
  }

  // ============================================
  // Phase 3 Commands
  // ============================================

  async _handlePortfolio(msg) {
    const chatId = msg.chat.id.toString();
    const telegramId = msg.from.id.toString();

    try {
      const user = await getUserByTelegramId(telegramId);
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ You need to login first at the ARGUS dashboard.\nVisit the website and click "Sign in with Telegram".');
        return;
      }

      const wallets = await getWallets(user.id);
      const portfolio = await getUserPortfolioValue(user.id);
      const openPositions = await getPositions(user.id, 'open');

      if (wallets.length === 0) {
        await this.bot.sendMessage(chatId, '📋 *Simulated Portfolio*\n\nYour portfolio is empty! Visit the dashboard to fund your wallet.', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '📊 Open Dashboard', url: `${process.env.FRONTEND_URL || 'https://argus-backend-tkgz.onrender.com'}/dashboard` }
            ]]
          }
        });
        return;
      }

      const pnlSign = portfolio.totalPnlUsd >= 0 ? '+' : '';
      const pnlEmoji = portfolio.totalPnlUsd >= 0 ? '📈' : '📉';

      let text = `📋 *Simulated Portfolio*\n\n`;
      text += `💰 Total Value: *$${portfolio.totalValueUsd.toFixed(2)}*\n`;
      text += `${pnlEmoji} P&L: ${pnlSign}$${portfolio.totalPnlUsd.toFixed(2)} (${pnlSign}${portfolio.totalPnlPct.toFixed(1)}%)\n\n`;

      text += `*Wallet Balances:*\n`;
      for (const w of wallets) {
        text += `  ${w.asset}: ${w.balance.toFixed(6)} (~$${w.balance_usd.toFixed(2)})\n`;
      }

      if (openPositions.length > 0) {
        text += `\n*Open Positions: ${openPositions.length}*\n`;
        for (const p of openPositions.slice(0, 5)) {
          const sign = p.pnl_usd >= 0 ? '+' : '';
          const em = p.pnl_usd >= 0 ? '📈' : '📉';
          text += `  ${p.protocol_name}: ${sign}$${p.pnl_usd.toFixed(2)} (${sign}${p.pnl_pct.toFixed(1)}%) ${em}\n`;
        }
      }

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '📊 Open Dashboard', url: `${process.env.FRONTEND_URL || 'https://argus-backend-tkgz.onrender.com'}/dashboard` }
          ]]
        }
      });
    } catch (error) {
      logger.error({ error: error.message }, 'Portfolio command failed');
      await this.bot.sendMessage(chatId, '❌ Error fetching portfolio.');
    }
  }

  async _handlePositions(msg) {
    const chatId = msg.chat.id.toString();
    const telegramId = msg.from.id.toString();

    try {
      const user = await getUserByTelegramId(telegramId);
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ Login first at the ARGUS dashboard.');
        return;
      }

      const positions = await getPositions(user.id, 'open');
      if (positions.length === 0) {
        await this.bot.sendMessage(chatId, '📋 No open positions. Accept a trade suggestion or open one on the dashboard!');
        return;
      }

      let text = `📋 *Open Positions*\n\n`;
      const buttons = [];

      for (const p of positions.slice(0, 10)) {
        const sign = p.pnl_usd >= 0 ? '+' : '';
        const em = p.pnl_usd >= 0 ? '📈' : '📉';
        text += `*${p.protocol_name}* (${p.chain})\n`;
        text += `  Tokens: ${p.to_amount.toFixed(4)} ${p.to_asset}\n`;
        text += `  Entry: $${p.entry_price_usd.toFixed(4)} | Current: $${(p.current_price_usd || p.entry_price_usd).toFixed(4)}\n`;
        text += `  P&L: ${sign}$${p.pnl_usd.toFixed(2)} (${sign}${p.pnl_pct.toFixed(1)}%) ${em}\n\n`;
        
        buttons.push([{ text: `🏃 Close ${p.protocol_name} (${sign}$${p.pnl_usd.toFixed(2)})`, callback_data: `position:close:${p.id}` }]);
      }

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
      });
    } catch (error) {
      logger.error({ error: error.message }, 'Positions command failed');
      await this.bot.sendMessage(chatId, '❌ Error fetching positions.');
    }
  }

  async _handleReport(msg) {
    const chatId = msg.chat.id.toString();
    const telegramId = msg.from.id.toString();

    try {
      const user = await getUserByTelegramId(telegramId);
      const scores = await getAllLatestScores();
      const emoji = { GREEN: '🟢', YELLOW: '🟡', ORANGE: '🟠', RED: '🔴' };

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      let report = `📡 *ARGUS Report — ${timeStr}*\n\n`;

      for (const s of scores) {
        const e = emoji[s.alert_level] || '❓';
        const note = s.alert_level === 'RED' ? ' ⚡ CONTAGION ACTIVE' : '';
        report += `${e} *${s.protocol_id}*: ${s.score}/100 — ${s.alert_level}${note}\n`;
      }

      if (user) {
        const portfolio = await getUserPortfolioValue(user.id);
        const openPositions = await getPositions(user.id, 'open');
        const pnlSign = portfolio.totalPnlUsd >= 0 ? '+' : '';
        const pnlEmoji = portfolio.totalPnlUsd >= 0 ? '📈' : '📉';

        report += `\nYour portfolio: *$${portfolio.totalValueUsd.toFixed(2)}* | P&L: ${pnlSign}$${portfolio.totalPnlUsd.toFixed(2)} ${pnlEmoji}\n`;

        if (openPositions.length > 0) {
          report += `\nOpen positions: ${openPositions.length}\n━━━━━━━━━━━━━━━━━━━━━\n`;
          for (const pos of openPositions.slice(0, 5)) {
            const posSign = pos.pnl_usd >= 0 ? '+' : '';
            const posEmoji = pos.pnl_usd >= 0 ? '📈' : '📉';
            report += `${pos.to_asset}: ${posSign}$${pos.pnl_usd.toFixed(2)} (${posSign}${pos.pnl_pct.toFixed(1)}%) ${posEmoji}\n`;
          }
        }
      } else {
        report += '\n_Login at the dashboard to see your portfolio._';
      }

      await this.bot.sendMessage(chatId, report, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '📊 Open Dashboard', url: `${process.env.FRONTEND_URL || 'https://argus-backend-tkgz.onrender.com'}/dashboard` }
          ]]
        }
      });
    } catch (error) {
      logger.error({ error: error.message }, 'Report command failed');
      await this.bot.sendMessage(chatId, '❌ Error generating report.');
    }
  }

  async _handleSettings(msg) {
    const chatId = msg.chat.id.toString();
    const telegramId = msg.from.id.toString();

    try {
      const user = await getUserByTelegramId(telegramId);
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ Login first at the ARGUS dashboard.');
        return;
      }

      const riskEmoji = { conservative: '🟢', moderate: '🟡', aggressive: '🔴' };
      const autoTradeStatus = user.auto_trade_enabled ? '✅ ON' : '❌ OFF';

      let text = `⚙️ *Settings*\n\n`;
      text += `Risk Tolerance: ${riskEmoji[user.risk_tolerance] || '🟡'} *${user.risk_tolerance}*\n`;
      text += `Auto-Trade: ${autoTradeStatus}\n`;
      text += `Max per trade: ${user.auto_trade_max_pct}% of balance\n`;

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🟢 Conservative', callback_data: 'settings:risk:conservative' },
              { text: '🟡 Moderate', callback_data: 'settings:risk:moderate' },
              { text: '🔴 Aggressive', callback_data: 'settings:risk:aggressive' }
            ],
            [
              { text: user.auto_trade_enabled ? '❌ Disable Auto-Trade' : '✅ Enable Auto-Trade',
                callback_data: user.auto_trade_enabled ? 'settings:autotrade:off' : 'settings:autotrade:on' }
            ]
          ]
        }
      });
    } catch (error) {
      logger.error({ error: error.message }, 'Settings command failed');
      await this.bot.sendMessage(chatId, '❌ Error loading settings.');
    }
  }

  // ============================================
  // Callback Query Handler (inline button presses)
  // ============================================

  async _handleCallbackQuery(query) {
    const chatId = query.message.chat.id.toString();
    const telegramId = query.from.id.toString();
    const data = query.data;

    try {
      // Suggestion actions
      if (data.startsWith('suggestion:')) {
        await this._handleSuggestionCallback(query, chatId, telegramId, data);
      }
      // Position actions
      else if (data.startsWith('position:')) {
        await this._handlePositionCallback(query, chatId, telegramId, data);
      }
      // Settings actions
      else if (data.startsWith('settings:')) {
        await this._handleSettingsCallback(query, chatId, telegramId, data);
      }

      // Acknowledge the callback
      await this.bot.answerCallbackQuery(query.id);
    } catch (error) {
      logger.error({ error: error.message, data }, 'Callback query failed');
      await this.bot.answerCallbackQuery(query.id, { text: '❌ Error processing action' });
    }
  }

  async _handleSuggestionCallback(query, chatId, telegramId, data) {
    const parts = data.split(':');
    const action = parts[1];
    const suggestionId = parseInt(parts[2]);

    const user = await getUserByTelegramId(telegramId);
    if (!user) {
      await this.bot.sendMessage(chatId, '❌ Login required.');
      return;
    }

    const suggestion = await getSuggestion(suggestionId);
    if (!suggestion || suggestion.user_id !== user.id) {
      await this.bot.sendMessage(chatId, '❌ Suggestion not found.');
      return;
    }

    if (action === 'accept') {
      try {
        const result = await executePaperTrade(user.id, suggestionId, suggestion.suggested_amount);

        // Disable buttons on original message
        await this.bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
          chat_id: chatId,
          message_id: query.message.message_id
        });

        const confirmMsg =
          `✅ *Trade Executed — Simulated Portfolio*\n\n` +
          `Bought: ${result.to_amount.toFixed(4)} tokens\n` +
          `Paid: $${suggestion.suggested_amount.toFixed(2)} worth of ${suggestion.suggested_from_asset}\n` +
          `Entry price: $${result.entry_price_usd.toFixed(4)}\n\n` +
          `📊 Track your position on the dashboard`;

        await this.bot.sendMessage(chatId, confirmMsg, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '📊 View Dashboard', url: `${process.env.FRONTEND_URL || 'https://argus-backend-tkgz.onrender.com'}/dashboard` }
            ]]
          }
        });
      } catch (err) {
        await this.bot.sendMessage(chatId, `❌ Trade failed: ${err.message}`);
      }
    }
    else if (action === 'edit') {
      // Set session to await amount input
      await setUserSession(telegramId, 'edit_amount', suggestionId);

      const maxAmount = suggestion.suggested_amount * 5; // Allow up to 5x suggested
      await this.bot.sendMessage(chatId,
        `✏️ Enter your preferred amount in USD\n(Max: $${maxAmount.toFixed(2)})\n\nReply with a number, e.g: 100`,
        { parse_mode: 'Markdown' }
      );
    }
    else if (action === 'chart') {
      const pairAddress = suggestion.pair_id.split('-')[0];
      const chain = suggestion.chain;
      const chartUrl = `https://dexscreener.com/${chain}/${pairAddress}`;
      await this.bot.sendMessage(chatId, `📊 *Chart for ${suggestion.protocol_name}*\n\n${chartUrl}`, { parse_mode: 'Markdown' });
    }
    else if (action === 'decline') {
      await updateSuggestion(suggestionId, {
        status: 'declined',
        responded_at: Math.floor(Date.now() / 1000)
      });

      // Disable buttons
      await this.bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: chatId,
        message_id: query.message.message_id
      });

      await this.bot.sendMessage(chatId, '❌ Suggestion declined.');
    }
  }

  async _handlePositionCallback(query, chatId, telegramId, data) {
    const parts = data.split(':');
    const action = parts[1];
    const positionId = parseInt(parts[2]);

    const user = await getUserByTelegramId(telegramId);
    if (!user) return;

    if (action === 'close') {
      const position = await getPosition(positionId);
      if (!position || position.user_id !== user.id) {
        await this.bot.sendMessage(chatId, '❌ Position not found.');
        return;
      }

      const closePrice = position.current_price_usd || position.entry_price_usd;
      const result = await dbClosePosition(positionId, closePrice, 'manual');

      if (result) {
        // Return assets to wallet
        const returnUsd = position.from_amount_usd + (result.pnl_usd || 0);
        const wallet = await getWallet(user.id, position.from_asset);
        if (wallet) {
          const pricePerUnit = wallet.balance > 0 ? wallet.balance_usd / wallet.balance : 1;
          const returnAsset = returnUsd / (pricePerUnit || 1);
          await updateWallet(user.id, position.from_asset, {
            balance: wallet.balance + returnAsset,
            balance_usd: wallet.balance_usd + returnUsd
          });
        }

        const pnlSign = result.pnl_usd >= 0 ? '+' : '';
        await this.bot.sendMessage(chatId,
          `✅ *Position Closed*\n\n${position.protocol_name}: ${pnlSign}$${result.pnl_usd.toFixed(2)} (${pnlSign}${result.pnl_pct.toFixed(1)}%)`,
          { parse_mode: 'Markdown' }
        );

        // Disable buttons
        await this.bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
          chat_id: chatId,
          message_id: query.message.message_id
        });
      }
    }
    else if (action === 'hold') {
      await this.bot.sendMessage(chatId, '⏳ Holding position. I\'ll keep monitoring.');
      await this.bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
        chat_id: chatId,
        message_id: query.message.message_id
      });
    }
  }

  async _handleSettingsCallback(query, chatId, telegramId, data) {
    const user = await getUserByTelegramId(telegramId);
    if (!user) return;

    const parts = data.split(':');

    if (parts[1] === 'risk') {
      const level = parts[2]; // conservative, moderate, aggressive
      await updateUserSettings(user.id, { risk_tolerance: level });
      await this.bot.sendMessage(chatId, `✅ Risk tolerance set to *${level}*`, { parse_mode: 'Markdown' });
    }
    else if (parts[1] === 'autotrade') {
      const enabled = parts[2] === 'on';
      await updateUserSettings(user.id, { auto_trade_enabled: enabled });
      await this.bot.sendMessage(chatId, `✅ Auto-trade ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  // ============================================
  // Message Handler (for edit amount flow)
  // ============================================

  async _handleMessage(msg) {
    // Skip commands
    if (msg.text && msg.text.startsWith('/')) return;

    const telegramId = msg.from.id.toString();
    const session = await getUserSession(telegramId);
    
    if (!session || session.awaiting !== 'edit_amount') return;

    const chatId = msg.chat.id.toString();
    const amount = parseFloat(msg.text);

    if (isNaN(amount) || amount <= 0) {
      await this.bot.sendMessage(chatId, '❌ Invalid amount. Please enter a number like: 50');
      return;
    }

    try {
      const user = await getUserByTelegramId(telegramId);
      if (!user) return;

      const result = await executePaperTrade(user.id, session.suggestion_id, amount);
      await clearUserSession(telegramId);

      const confirmMsg =
        `✅ *Trade Executed — Simulated Portfolio*\n\n` +
        `Amount: $${amount.toFixed(2)}\n` +
        `Tokens received: ${result.to_amount.toFixed(4)}\n` +
        `Entry price: $${result.entry_price_usd.toFixed(4)}\n\n` +
        `📊 Track on dashboard`;

      await this.bot.sendMessage(chatId, confirmMsg, { parse_mode: 'Markdown' });
    } catch (err) {
      await clearUserSession(telegramId);
      await this.bot.sendMessage(chatId, `❌ Trade failed: ${err.message}`);
    }
  }

  // ============================================
  // Alert Broadcasting (Phase 2 — unchanged)
  // ============================================

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

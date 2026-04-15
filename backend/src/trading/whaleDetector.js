/**
 * Whale Detector - Monitors liquidity events for large whale entries/exits.
 * Triggers trade suggestions for eligible users when smart money enters a protocol.
 */
import {
  isCanaryWallet, getUsersWithTelegram, getWallets,
  getLatestScore, createSuggestion, hasRecentSuggestion,
  getPositions
} from '../database/phase2Db.js';
import { calculateSuggestedAllocation } from './suggestionEngine.js';
import { MONITORED_PROTOCOLS } from '../config/protocols.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('trading/whale-detector');

// Reference to the telegram bot (set during init)
let telegramBot = null;

// Threshold for whale detection (USD)
const WHALE_ENTRY_THRESHOLD = parseFloat(process.env.WHALE_ENTRY_THRESHOLD_USD || '50000');
const LARGE_WHALE_THRESHOLD = 500000;

/**
 * Initialize the whale detector with the telegram bot instance.
 */
export function initWhaleDetector(bot) {
  telegramBot = bot;
  logger.info({ threshold: WHALE_ENTRY_THRESHOLD }, 'Whale detector initialized');
}

/**
 * Process a liquidity event from the WebSocket feed.
 * Called from the liq_event handler in server.js.
 */
export async function onLiquidityEvent(event, chain) {
  try {
    if (!event || !event.tx) return;
    const tx = event.tx;
    const amountUsd = parseFloat(tx.amount_usd || '0');
    if (amountUsd < WHALE_ENTRY_THRESHOLD) return;

    const isAddLiquidity = tx.action === 'addLiquidity' || tx.tx_swap_type === 0;
    const isRemoveLiquidity = tx.action === 'removeLiquidity' || tx.tx_swap_type === 1;

    if (!isAddLiquidity && !isRemoveLiquidity) return;

    const senderAddress = tx.wallet_address || tx.sender || '';
    if (!senderAddress) return;

    // Find matching monitored protocol
    const protocol = MONITORED_PROTOCOLS.find(p =>
      p.chain === chain && event.address &&
      p.pairId.toLowerCase().startsWith(event.address.toLowerCase())
    );
    if (!protocol) return;

    // Check if sender is a canary wallet
    const isCanary = await isCanaryWallet(senderAddress, chain);

    if (isAddLiquidity && isCanary) {
      logger.info({
        wallet: senderAddress.substring(0, 10),
        amountUsd,
        protocol: protocol.id
      }, '🐋 Smart money ENTRY detected');
      await triggerEntrySuggestion({ amountUsd, sender: senderAddress, chain }, protocol);
    }

    if (isRemoveLiquidity && isCanary) {
      logger.info({
        wallet: senderAddress.substring(0, 10),
        amountUsd,
        protocol: protocol.id
      }, '🐋 Smart money EXIT detected');
      await triggerExitWarning({ amountUsd, sender: senderAddress, chain }, protocol);
    }

    // Even for non-canary: if amount is very large, alert
    if (amountUsd > LARGE_WHALE_THRESHOLD && !isCanary) {
      logger.info({
        wallet: senderAddress.substring(0, 10),
        amountUsd,
        protocol: protocol.id
      }, '🐋 Large whale movement (non-canary)');
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Whale detector error');
  }
}

/**
 * Trigger buy suggestions for all eligible users when a whale enters.
 */
async function triggerEntrySuggestion(event, protocol) {
  try {
    const latestScore = await getLatestScore(protocol.id);
    const score = latestScore ? latestScore.score : 25;

    const users = await getUsersWithTelegram();

    for (const user of users) {
      // Rate limit: max 1 suggestion per protocol per hour per user
      if (await hasRecentSuggestion(user.id, protocol.id)) continue;

      const wallets = await getWallets(user.id);
      if (!wallets || wallets.length === 0) continue;
      const totalUSD = wallets.reduce((s, w) => s + w.balance_usd, 0);
      if (totalUSD < 10) continue;

      // Calculate suggestion
      const suggestion = calculateSuggestedAllocation(
        user, wallets,
        { amount_usd: event.amountUsd, wallet: event.sender },
        score
      );

      if (suggestion.suggested_amount_usd < 1) continue;

      // Save to DB
      const suggestionId = await createSuggestion({
        user_id: user.id,
        protocol_id: protocol.id,
        protocol_name: protocol.name,
        token_id: protocol.tokenId,
        pair_id: protocol.pairId,
        chain: protocol.chain,
        trigger_type: 'whale_entry',
        trigger_description: `Smart wallet added $${Math.round(event.amountUsd).toLocaleString()} in liquidity to ${protocol.name}`,
        whale_amount_usd: event.amountUsd,
        whale_wallet: event.sender,
        suggested_from_asset: suggestion.from_asset,
        suggested_amount: suggestion.suggested_amount_usd,
        suggested_amount_asset: suggestion.suggested_amount_asset,
        suggested_pct_of_balance: suggestion.suggested_pct_of_balance,
        agent_reasoning: suggestion.reasoning,
        expires_at: Math.floor(Date.now() / 1000) + 600
      });

      // Send Telegram message
      if (telegramBot && telegramBot.bot) {
        await sendSuggestionMessage(user.telegram_id, suggestionId, event, suggestion, protocol, score);
      }
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to trigger entry suggestion');
  }
}

/**
 * Warn users with open positions when a whale exits.
 */
async function triggerExitWarning(event, protocol) {
  try {
    const users = await getUsersWithTelegram();

    for (const user of users) {
      const positions = await getPositions(user.id, 'open');
      const exposed = positions.filter(p => p.protocol_id === protocol.id);
      if (exposed.length === 0) continue;

      if (telegramBot && telegramBot.bot) {
        for (const position of exposed) {
          const pnlEmoji = position.pnl_usd >= 0 ? '📈' : '📉';
          const pnlSign = position.pnl_usd >= 0 ? '+' : '';

          const message =
            `⚠️ *POSITION ALERT — ${protocol.name} (${protocol.chain.toUpperCase()})*\n\n` +
            `A smart wallet just removed $${Math.round(event.amountUsd).toLocaleString()} in liquidity.\n` +
            `You currently hold a position in this protocol.\n\n` +
            `Your position: ${position.to_amount.toFixed(2)} tokens | Entry: $${position.entry_price_usd.toFixed(4)}\n` +
            `Current P&L: ${pnlSign}$${position.pnl_usd.toFixed(2)} (${pnlSign}${position.pnl_pct.toFixed(1)}%) ${pnlEmoji}`;

          await telegramBot.bot.sendMessage(user.telegram_id, message, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: `🏃 Close Position (${pnlSign}$${position.pnl_usd.toFixed(2)})`, callback_data: `position:close:${position.id}` },
                { text: '⏳ Hold', callback_data: `position:hold:${position.id}` }
              ]]
            }
          });
        }
      }
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to trigger exit warning');
  }
}

/**
 * Sends a trade suggestion message via Telegram with inline buttons.
 */
async function sendSuggestionMessage(telegramId, suggestionId, event, suggestion, protocol, score) {
  try {
    const scoreEmoji = score < 25 ? '🟢 GREEN'
      : score < 46 ? '🟡 YELLOW'
      : score < 71 ? '🟠 ORANGE'
      : '🔴 RED';

    const whaleSize = event.amountUsd > 1_000_000
      ? `$${(event.amountUsd / 1e6).toFixed(1)}M`
      : `$${Math.round(event.amountUsd / 1000)}K`;

    const message =
      `🐋 *WHALE ALERT — ${protocol.name} (${protocol.chain.toUpperCase()})*\n\n` +
      `A smart wallet just added ${whaleSize} in liquidity.\n\n` +
      `Protocol Risk Score: ${score}/100 ${scoreEmoji}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *ARGUS Suggestion:*\n` +
      `Allocate $${suggestion.suggested_amount_usd.toFixed(2)} from your ${suggestion.from_asset} balance\n` +
      `(${suggestion.suggested_pct_of_balance.toFixed(1)}% of your ${suggestion.from_asset})\n\n` +
      `${suggestion.reasoning}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⏱ Expires in 10 minutes`;

    const msg = await telegramBot.bot.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: `✅ Yes — Execute $${suggestion.suggested_amount_usd.toFixed(2)}`, callback_data: `suggestion:accept:${suggestionId}` },
            { text: '✏️ Edit Amount', callback_data: `suggestion:edit:${suggestionId}` }
          ],
          [
            { text: '📊 Show Chart', callback_data: `suggestion:chart:${suggestionId}` },
            { text: '❌ No Thanks', callback_data: `suggestion:decline:${suggestionId}` }
          ]
        ]
      }
    });

    // Store telegram message ID so we can edit/disable buttons later
    if (msg) {
      const { updateSuggestion: updateSug } = await import('../database/phase2Db.js');
      await updateSug(suggestionId, { telegram_message_id: String(msg.message_id) });
    }

    logger.info({ telegramId, suggestionId }, 'Suggestion message sent');
  } catch (error) {
    logger.error({ error: error.message, telegramId }, 'Failed to send suggestion message');
  }
}

export default { initWhaleDetector, onLiquidityEvent };

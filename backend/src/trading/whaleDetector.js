/**
 * Whale Detector - Monitors liquidity events for large whale entries/exits.
 * Simplified for pure broadcast model.
 */
import * as db from '../database/phase2Db.js';
import { broadcastAlert } from '../alerts/telegramBot.js';
import { MONITORED_PROTOCOLS } from '../config/protocols.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('trading/whale-detector');

// Threshold for alert triggering (USD)
const WHALE_ENTRY_THRESHOLD = 50000;

/**
 * Initialize the whale detector. (No-op now that it's just broadcasting)
 */
export function initWhaleDetector() {
  logger.info('Whale detector initialized');
}

/**
 * Process a liquidity event from the WebSocket feed.
 */
export async function onLiquidityEvent(event, chain) {
  try {
    if (!event || !event.tx) return;
    const tx = event.tx;
    const amountUsd = parseFloat(tx.amount_usd || '0');
    
    // Only care about significant moves
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
    const canary = await db.isCanaryWallet(senderAddress, chain);
    if (!canary) return; // Only broadcast for canary wallets as per prompt

    if (isAddLiquidity) {
      logger.info({ protocol: protocol.id, wallet: senderAddress }, '🐋 Smart money ENTRY detected');
      await broadcastWhaleMove(protocol, senderAddress, amountUsd, canary, true);
    } else {
      logger.info({ protocol: protocol.id, wallet: senderAddress }, '🐋 Smart money EXIT detected');
      await broadcastWhaleMove(protocol, senderAddress, amountUsd, canary, false);
    }

  } catch (error) {
    logger.error({ error: error.message }, 'Whale detector error');
  }
}

async function broadcastWhaleMove(protocol, sender, amountUsd, canary, isEntry) {
  const latestScoreData = await db.getLatestScore(protocol.id);
  const score = latestScoreData ? latestScoreData.score : 0;
  const level = latestScoreData ? latestScoreData.alert_level : 'GREEN';
  const icon = level === 'GREEN' ? '🟢 SAFE' : (level === 'YELLOW' ? '🟡 MONITOR' : (level === 'ORANGE' ? '🟠 WARNING' : '🔴 DANGER'));

  const action = isEntry ? 'added' : 'removed';
  const typeLabel = isEntry ? 'WHALE MOVE' : 'WHALE EXIT';
  const emoji = isEntry ? '🐋' : '💨';
  
  const formattedAmount = amountUsd >= 1000000 
    ? `$${(amountUsd / 1000000).toFixed(1)}M` 
    : `$${Math.round(amountUsd / 1000)}K`;

  const profitRate = canary.total_profit_rate ? `${(canary.total_profit_rate * 100).toFixed(0)}%` : 'high';

  const message = 
    `${emoji} *${typeLabel} — ${protocol.name}*\n\n` +
    `A top-performing wallet just ${action} *${formattedAmount}* in liquidity.\n\n` +
    `Protocol score: ${score}/100 ${icon}\n` +
    // `TVL: ${protocol.tvl_formatted || 'N/A'}\n\n` +
    `This wallet has a ${profitRate} total profit rate — historically a ${isEntry ? 'bullish' : 'risk'} signal.\n\n` +
    `📊 https://dexscreener.com/${protocol.dexScreenerChain}/${protocol.dexScreenerPair}`;

  await broadcastAlert(message);
}

export default { initWhaleDetector, onLiquidityEvent };

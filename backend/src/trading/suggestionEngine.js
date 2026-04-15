/**
 * Suggestion Engine - Calculates optimal paper trade allocation based on
 * user risk settings, portfolio composition, and market conditions.
 */
import { createLogger } from '../utils/logger.js';

const logger = createLogger('trading/suggestion-engine');

/**
 * Calculates the suggested allocation for a whale-triggered trade.
 * 
 * @param {Object} user - User row from DB (risk_tolerance, auto_trade_max_pct)
 * @param {Array} wallets - User's wallet rows (asset, balance, balance_usd)
 * @param {Object} whaleEvent - { amount_usd, wallet }
 * @param {number} protocolRiskScore - Current contagion score (0-100)
 * @returns {Object} { from_asset, suggested_amount_usd, suggested_amount_asset, suggested_pct_of_balance, reasoning }
 */
export function calculateSuggestedAllocation(user, wallets, whaleEvent, protocolRiskScore) {
  // 1. Get user's total portfolio value in USD
  const totalPortfolioUSD = wallets.reduce((sum, w) => sum + w.balance_usd, 0);

  // 2. Determine base allocation % based on risk tolerance
  const baseAllocPct = {
    conservative: 1.0,
    moderate: 2.0,
    aggressive: 5.0
  }[user.risk_tolerance] || 2.0;

  // 3. Scale down if risk score is elevated
  const riskMultiplier = protocolRiskScore < 25 ? 1.0
    : protocolRiskScore < 45 ? 0.75
    : protocolRiskScore < 70 ? 0.5
    : 0.25;

  // 4. Scale up if whale amount is very large (conviction signal)
  const whaleMultiplier = whaleEvent.amount_usd > 5_000_000 ? 1.5
    : whaleEvent.amount_usd > 1_000_000 ? 1.25
    : 1.0;

  // 5. Compute final suggested USD amount
  let suggestedUSD = totalPortfolioUSD
    * (baseAllocPct / 100)
    * riskMultiplier
    * whaleMultiplier;

  // 6. Apply user's hard cap
  const hardCapUSD = totalPortfolioUSD * (user.auto_trade_max_pct / 100);
  suggestedUSD = Math.min(suggestedUSD, hardCapUSD);

  // 7. Pick the best asset to trade FROM
  const assetPriority = ['BTC', 'ETH', 'SOL', 'BNB', 'USDT'];
  let fromWallet = null;
  for (const asset of assetPriority) {
    const wallet = wallets.find(w => w.asset === asset && w.balance_usd >= suggestedUSD * 2);
    if (wallet) { fromWallet = wallet; break; }
  }

  // If no wallet has enough, pick the one with the highest balance
  if (!fromWallet) {
    fromWallet = wallets.reduce((a, b) => a.balance_usd > b.balance_usd ? a : b, wallets[0]);
    suggestedUSD = Math.min(suggestedUSD, fromWallet.balance_usd * 0.5);
  }

  // 8. Convert USD amount to asset amount
  const pricePerUnit = fromWallet.balance > 0 ? fromWallet.balance_usd / fromWallet.balance : 1;
  const suggestedAssetAmount = suggestedUSD / pricePerUnit;

  // 9. Build reasoning
  const reasoning = buildReasoning(user, whaleEvent, protocolRiskScore, suggestedUSD, fromWallet, riskMultiplier);

  logger.info({
    userId: user.id,
    fromAsset: fromWallet.asset,
    suggestedUSD: suggestedUSD.toFixed(2),
    riskMultiplier,
    whaleMultiplier
  }, 'Suggestion calculated');

  return {
    from_asset: fromWallet.asset,
    suggested_amount_usd: Math.round(suggestedUSD * 100) / 100,
    suggested_amount_asset: suggestedAssetAmount,
    suggested_pct_of_balance: (suggestedUSD / fromWallet.balance_usd) * 100,
    reasoning
  };
}

function buildReasoning(user, whaleEvent, score, amount, wallet, riskMult) {
  const whaleSize = whaleEvent.amount_usd > 1_000_000
    ? `$${(whaleEvent.amount_usd / 1e6).toFixed(1)}M`
    : `$${Math.round(whaleEvent.amount_usd / 1000)}K`;

  const riskNote = riskMult < 1
    ? ` (reduced ${Math.round((1 - riskMult) * 100)}% due to ${score < 70 ? 'elevated' : 'high'} risk score of ${score})`
    : '';

  return `A whale just moved ${whaleSize} into this protocol — historically a bullish signal. ` +
    `Based on your ${user.risk_tolerance} risk setting, I suggest allocating $${amount.toFixed(2)}` +
    ` from your ${wallet.asset} balance${riskNote}. You can edit this amount before confirming.`;
}

export default { calculateSuggestedAllocation };

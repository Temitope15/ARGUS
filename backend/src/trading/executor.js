/**
 * Paper Trade Executor - Executes virtual trades by updating DB state.
 * No blockchain transactions — all trades are database writes.
 */
import {
  getSuggestion, getWallet, updateWallet,
  createPosition, updateSuggestion, logFunding,
  runTransaction, getUserById
} from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('trading/executor');

/**
 * Executes a paper trade from a suggestion.
 * 
 * @param {number} userId - User ID  
 * @param {number} suggestionId - Suggestion ID
 * @param {number} amountUSD - USD amount to trade (user may have edited)
 * @returns {Object} { success, position_id, from_amount, to_amount }
 */
export async function executePaperTrade(userId, suggestionId, amountUSD) {
  const suggestion = await getSuggestion(suggestionId);
  if (!suggestion) throw new Error('Suggestion not found');

  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  // Validate
  if (suggestion.user_id !== userId) throw new Error('Not your suggestion');
  if (suggestion.status !== 'pending') throw new Error('Suggestion already responded to');
  if (Date.now() / 1000 > suggestion.expires_at) throw new Error('Suggestion expired');

  // Validate amount
  if (isNaN(amountUSD) || amountUSD <= 0) throw new Error('Invalid amount');

  // Get wallet balance
  const wallet = await getWallet(userId, suggestion.suggested_from_asset);
  if (!wallet || wallet.balance_usd < amountUSD) throw new Error('Insufficient balance');

  // Calculate amounts using existing price data from wallet
  const pricePerUnit = wallet.balance > 0 ? wallet.balance_usd / wallet.balance : 1;
  const fromAmountAsset = amountUSD / pricePerUnit;

  // Use the suggestion's entry price for the target token
  // In a real system we'd fetch live price; here we use the suggestion's stored data
  const entryPriceUsd = suggestion.suggested_amount > 0
    ? amountUSD / (suggestion.suggested_amount_asset * (amountUSD / suggestion.suggested_amount))
    : amountUSD / 1; // fallback

  const toAmountAsset = amountUSD / Math.max(entryPriceUsd, 0.0001);

  // Execute in a transaction
  let positionId;
  await runTransaction(async (tx) => {
    // Deduct from wallet
    await updateWallet(userId, suggestion.suggested_from_asset, {
      balance: wallet.balance - fromAmountAsset,
      balance_usd: wallet.balance_usd - amountUSD
    }, tx);

    // Create position
    positionId = await createPosition({
      user_id: userId,
      protocol_id: suggestion.protocol_id,
      protocol_name: suggestion.protocol_name,
      token_id: suggestion.token_id,
      pair_id: suggestion.pair_id,
      chain: suggestion.chain,
      from_asset: suggestion.suggested_from_asset,
      from_amount: fromAmountAsset,
      from_amount_usd: amountUSD,
      to_asset: suggestion.protocol_name.split(' ')[0], // Use protocol name as token symbol
      to_amount: toAmountAsset,
      entry_price_usd: entryPriceUsd,
      trigger_type: suggestion.trigger_type,
      trigger_description: suggestion.trigger_description,
      agent_suggested: 1,
      opened_at: Math.floor(Date.now() / 1000)
    }, tx);

    // Update suggestion status
    await updateSuggestion(suggestionId, {
      status: 'accepted',
      position_id: positionId,
      responded_at: Math.floor(Date.now() / 1000)
    }, tx);

    // Log funding event (negative = deduction)
    await logFunding(userId, suggestion.suggested_from_asset, -fromAmountAsset, -amountUSD, pricePerUnit, tx);
  });

  logger.info({
    userId,
    suggestionId,
    positionId,
    amountUSD,
    fromAsset: suggestion.suggested_from_asset,
    fromAmount: fromAmountAsset
  }, 'Paper trade executed');

  return {
    success: true,
    position_id: positionId,
    from_amount: fromAmountAsset,
    to_amount: toAmountAsset,
    entry_price_usd: entryPriceUsd
  };
}

export default { executePaperTrade };

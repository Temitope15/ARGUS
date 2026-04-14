/**
 * Event Normalizer - Converts raw AVE API responses into internal schema objects.
 * 
 * AVE API Response Shapes (verified against live API 2026-04-14):
 * 
 * WS swap (result.tx): { amm, amount_eth, amount_usd, block_number, chain, direction,
 *   from_address, from_amount, from_price_eth, from_price_usd, from_reserve, from_symbol,
 *   pair_address, pair_liquidity_usd, sender, target_token, time, to_address, to_amount,
 *   to_price_usd, to_symbol, transaction, tvl, wallet_address, wallet_tag }
 * 
 * REST /v2/tokens/price (data[tokenId]): { current_price_usd, price_change_1d, price_change_24h,
 *   tvl, fdv, market_cap, tx_volume_u_24h, token_id, updated_at, holders }
 * 
 * REST /v2/pairs/{pairId} (data): { pair, chain, token0_symbol, token1_symbol, reserve0, reserve1,
 *   tvl, price_change_1h, price_change_4h, price_change_24h, volume_u_1h, volume_u_4h,
 *   buy_volume_u_1h, sell_volume_u_1h, buys_tx_4h_count, sells_tx_4h_count, ... }
 * 
 * REST /v2/txs/liq/{pairId} (data.txs[]): { amount_usd, amount0, amount1, tx_time, chain,
 *   transaction, block_number, amm, sender, type, token0_symbol, token1_symbol, wallet_address }
 * 
 * REST /v2/contracts/{tokenId} (data): { analysis_risk_score, holders, token_lock_percent, ...}
 */
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('event-normalizer');

export const eventNormalizer = {
  /**
   * Normalizes a WebSocket swap/transaction event.
   * WS messages arrive as: { result: { topic: 'tx', tx: { ... } } }
   * The wsManager already extracts `result` or `params`, so `raw` here
   * is either the `result` object or the inner `tx` object.
   */
  normalizeSwap: (raw) => {
    // Handle both shapes: raw might be {topic, tx: {...}} or the tx itself
    const tx = raw.tx || raw;
    
    try {
      // AVE WS gives us direction: 'buy' or 'sell' relative to target_token
      const isSell = (tx.direction === 'sell');

      return {
        id: uuidv4(),
        timestamp: (tx.time || Math.floor(Date.now() / 1000)) * 1000,
        chain: tx.chain || '',
        pairAddress: tx.pair_address || '',
        walletAddress: tx.wallet_address || tx.sender || '',
        fromToken: tx.from_symbol || '',
        toToken: tx.to_symbol || '',
        fromAmountUsd: parseFloat(tx.from_price_usd || 0) * parseFloat(tx.from_amount || 0),
        toAmountUsd: parseFloat(tx.to_price_usd || 0) * parseFloat(tx.to_amount || 0),
        amountUsd: parseFloat(tx.amount_usd || 0),
        isSell,
        pairLiquidityUsd: parseFloat(tx.pair_liquidity_usd || 0),
        txHash: tx.transaction || '',
        blockNumber: parseInt(tx.block_number || 0),
        rawData: JSON.stringify(tx)
      };
    } catch (error) {
      logger.error({ error: error.message, rawKeys: Object.keys(tx) }, 'Failed to normalize swap');
      return null;
    }
  },

  /**
   * Normalizes a WebSocket liquidity event.
   * Currently, liq events come via REST polling (/v2/txs/liq/{pairId}),
   * but can also arrive via WS subscription.
   */
  normalizeLiquidity: (raw) => {
    // Handle WS shape (result.tx) vs REST shape (txs[] item)
    const tx = raw.tx || raw;

    try {
      return {
        id: uuidv4(),
        timestamp: (tx.tx_time || tx.time || Math.floor(Date.now() / 1000)) * 1000,
        chain: tx.chain || '',
        protocol: tx.amm || 'unknown',
        pairAddress: tx.pair_address || tx.pair || '',
        tokenIn: tx.token0_symbol || tx.from_symbol || '',
        tokenOut: tx.token1_symbol || tx.to_symbol || '',
        amountUsd: parseFloat(tx.amount_usd || 0),
        eventType: tx.type || tx.event_type || 'unknown', // 'addLiquidity' / 'removeLiquidity'
        walletAddress: tx.wallet_address || tx.sender || '',
        txHash: tx.transaction || tx.tx_id || '',
        blockNumber: parseInt(tx.block_number || 0),
        rawData: JSON.stringify(tx)
      };
    } catch (error) {
      logger.error({ error: error.message, rawKeys: Object.keys(tx) }, 'Failed to normalize liquidity');
      return null;
    }
  },

  /**
   * Normalizes a token price/TVL snapshot from REST polling.
   * REST /v2/tokens/price returns: data = { [tokenId]: { current_price_usd, tvl, ... } }
   * The caller passes each token's object with the tokenId embedded.
   */
  normalizePriceSnapshot: (raw, source = 'rest_poll') => {
    try {
      // Extract chain and address from token_id if available (format: "0x...-eth")
      let chain = raw.chain || '';
      let tokenAddress = raw.address || raw.token_address || '';
      let symbol = raw.symbol || raw.token_symbol || '';

      if (raw.token_id && raw.token_id.includes('-')) {
        const parts = raw.token_id.split('-');
        tokenAddress = tokenAddress || parts[0];
        chain = chain || parts[1];
      }

      return {
        id: uuidv4(),
        timestamp: Date.now(),
        chain,
        tokenAddress,
        symbol,
        priceUsd: parseFloat(raw.current_price_usd || raw.price || 0),
        tvl: parseFloat(raw.tvl || 0),
        priceChange1h: parseFloat(raw.price_change_1h || raw.price_change_1d || 0),
        priceChange24h: parseFloat(raw.price_change_24h || 0),
        volumeU24h: parseFloat(raw.tx_volume_u_24h || 0),
        source
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to normalize price snapshot');
      return null;
    }
  },

  /**
   * Normalizes a pair health snapshot from REST /v2/pairs/{pairId}.
   * Response shape: data = { pair, chain, token0_symbol, reserve0, reserve1, tvl,
   *   price_change_1h, volume_u_1h, buy_volume_u_1h, sell_volume_u_1h, ... }
   */
  normalizePairSnapshot: (raw, pairId) => {
    try {
      // pairId format: "0xABCD-eth" — derive address and chain
      const lastDash = pairId.lastIndexOf('-');
      const pairAddress = pairId.substring(0, lastDash);
      const chain = pairId.substring(lastDash + 1);

      const buyVolume1h = parseFloat(raw.buy_volume_u_1h || 0);
      const sellVolume1h = parseFloat(raw.sell_volume_u_1h || 0);

      return {
        id: uuidv4(),
        timestamp: Date.now(),
        chain,
        pairAddress,
        token0Symbol: raw.token0_symbol || '',
        token1Symbol: raw.token1_symbol || '',
        reserve0: parseFloat(raw.reserve0 || 0),
        reserve1: parseFloat(raw.reserve1 || 0),
        tvl: parseFloat(raw.tvl || 0),
        priceChange1h: parseFloat(raw.price_change_1h || 0),
        priceChange4h: parseFloat(raw.price_change_4h || 0),
        priceChange24h: parseFloat(raw.price_change_24h || 0),
        volumeU1h: parseFloat(raw.volume_u_1h || 0),
        volumeU4h: parseFloat(raw.volume_u_4h || 0),
        buyVolumeU1h: buyVolume1h,
        sellVolumeU1h: sellVolume1h,
        sellBuyRatio1h: buyVolume1h === 0 ? (sellVolume1h > 0 ? 999 : 0) : sellVolume1h / buyVolume1h,
        buysCount4h: parseInt(raw.buys_tx_4h_count || 0),
        sellsCount4h: parseInt(raw.sells_tx_4h_count || 0),
        source: 'rest_poll'
      };
    } catch (error) {
      logger.error({ error: error.message, pairId }, 'Failed to normalize pair snapshot');
      return null;
    }
  },

  /**
   * Normalizes contract risk from REST /v2/contracts/{tokenId}.
   * Response: data = { analysis_risk_score, holders, token_lock_percent, ... }
   */
  normalizeContractRisk: (raw, tokenId) => {
    try {
      const lastDash = tokenId.lastIndexOf('-');
      const tokenAddress = tokenId.substring(0, lastDash);
      const chain = tokenId.substring(lastDash + 1);

      return {
        id: uuidv4(),
        timestamp: Date.now(),
        chain,
        tokenAddress,
        analysisRiskScore: parseFloat(raw.analysis_risk_score || 0),
        holders: parseInt(raw.holders || 0),
        lockPercent: parseFloat(raw.token_lock_percent || 0),
        source: 'rest_poll'
      };
    } catch (error) {
      logger.error({ error: error.message, tokenId }, 'Failed to normalize contract risk');
      return null;
    }
  }
};

export default eventNormalizer;

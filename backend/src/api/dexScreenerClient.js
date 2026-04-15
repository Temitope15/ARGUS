/**
 * DexScreener Client - Fetches market data (Volume, Liquidity, Price Change).
 */
import axios from 'axios';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('dexscreener-client');

class DexScreenerClient {
  constructor() {
    this.baseUrl = 'https://api.dexscreener.com/latest/dex';
    this.instance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000
    });
  }

  /**
   * Fetches multiple pairs by their addresses.
   * @param {string} chainId - e.g. 'ethereum', 'bsc', 'solana'
   * @param {string[]} addresses - Array of pair addresses.
   * @returns {Promise<Array>} Array of pair data.
   */
  async getPairs(chainId, addresses) {
    if (!addresses.length) return [];
    try {
      const path = `/pairs/${chainId}/${addresses.join(',')}`;
      const response = await this.instance.get(path);
      return response.data?.pairs || [];
    } catch (error) {
      logger.error({ chainId, error: error.message }, 'Failed to fetch DexScreener pairs');
      return [];
    }
  }

  /**
   * Aggregated fetch for multiple chains.
   * @param {Object[]} protocolConfigs - List of protocols with dexScreenerPair and dexScreenerChain.
   */
  async fetchAllTrends(protocolConfigs) {
    const chainGroups = protocolConfigs.reduce((acc, p) => {
      if (!p.dexScreenerPair || !p.dexScreenerChain) return acc;
      if (!acc[p.dexScreenerChain]) acc[p.dexScreenerChain] = [];
      acc[p.dexScreenerChain].push(p.dexScreenerPair);
      return acc;
    }, {});

    const results = {};
    const promises = Object.entries(chainGroups).map(async ([chain, addresses]) => {
      const pairs = await this.getPairs(chain, addresses);
      pairs.forEach(pair => {
        results[pair.pairAddress.toLowerCase()] = {
          priceUsd: parseFloat(pair.priceUsd),
          priceChange24h: pair.priceChange?.h24 || 0,
          volume24h: pair.volume?.h24 || 0,
          liquidityUsd: pair.liquidity?.usd || 0,
          fdv: pair.fdv || 0,
          pairUrl: pair.url
        };
      });
    });

    await Promise.allSettled(promises);
    return results;
  }
}

export default new DexScreenerClient();

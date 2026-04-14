/**
 * AVE REST Client (Phase 2) - Handles specialized queries for smart money and holder surveillance.
 * 
 * All AVE endpoints return: { status, msg, data_type, data }
 * The actual payload is always in `data`.
 */
import axios from 'axios';
import { createLogger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';

const logger = createLogger('ave-rest-client-p2');

class AveRestClient {
  constructor() {
    this.primaryUrl = 'https://prod.ave-api.com';
    this.fallbackUrl = 'https://data.ave-api.xyz';
    this.apiKey = process.env.AVE_API_KEY;
    
    this.instance = axios.create({
      baseURL: this.primaryUrl,
      timeout: 15000,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      }
    });

    this._setupInterceptors();
  }

  _setupInterceptors() {
    this.instance.interceptors.response.use(
      (response) => {
        logger.debug({ 
          status: response.status, 
          url: response.config.url,
        }, 'AVE Response received');
        return response;
      },
      (error) => {
        const { response, config } = error;
        logger.warn({
          status: response?.status,
          url: config?.url,
          message: error.message
        }, 'AVE Request failed');
        return Promise.reject(error);
      }
    );
  }

  /**
   * Universal GET with retry, envelope unwrap, and fallback.
   * Unwraps { status, msg, data_type, data } → returns data
   */
  async _request(options) {
    const execute = async (baseUrl) => {
      const response = await this.instance({ ...options, baseURL: baseUrl });
      // Unwrap AVE envelope
      const body = response.data;
      if (body && typeof body === 'object' && body.data !== undefined) {
        return body.data;
      }
      return body;
    };

    try {
      const data = await withRetry(() => execute(this.primaryUrl), { 
        maxRetries: 3, 
        onRetryMessage: `Retrying AVE API (P2): ${options.url}` 
      });
      return { data, error: null };
    } catch (error) {
      try {
        logger.warn({ url: options.url }, 'Primary failed, trying fallback');
        const data = await execute(this.fallbackUrl);
        return { data, error: null };
      } catch (fallbackError) {
        return { data: null, error: fallbackError.message };
      }
    }
  }

  /**
   * Fetches top smart wallets for a chain.
   * Response (after unwrap): Array of { wallet_address, total_profit, total_profit_rate, ... }
   */
  async getSmartWallets(chain) {
    return await this._request({
      method: 'get',
      url: '/v2/address/smart_wallet/list',
      params: { chain, sort: 'total_profit' }
    });
  }

  /**
   * Fetches token holdings for a specific wallet.
   */
  async getWalletTokens(walletAddress, chain) {
    return await this._request({
      method: 'get',
      url: '/v2/address/walletinfo/tokens',
      params: { wallet_address: walletAddress, chain }
    });
  }

  /**
   * Fetches Top 100 holders for a token.
   * Response (after unwrap): Array of holders
   */
  async getTop100Holders(tokenId) {
    return await this._request({
      method: 'get',
      url: `/v2/tokens/top100/${tokenId}`
    });
  }
}

export default new AveRestClient();

/**
 * AVE REST API Client - Axios instance with retry logic and fallback.
 * 
 * All AVE endpoints wrap responses in: { status, msg, data_type, data }
 * The actual payload is always in `data`.
 */
import axios from 'axios';
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';

const logger = createLogger('ave-client');

class AveClient {
  constructor() {
    this.primaryUrl = config.ave.restPrimary;
    this.fallbackUrl = config.ave.restFallback;
    this.apiKey = config.ave.apiKey;
    
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
    // Request interceptor
    this.instance.interceptors.request.use((req) => {
      const { method, url, data } = req;
      logger.debug({ 
        method: method?.toUpperCase(), 
        url, 
        body: data ? (typeof data === 'string' ? data : JSON.stringify(data).substring(0, 100)) : undefined 
      }, 'Outgoing request');
      return req;
    });

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        logger.debug({ 
          status: response.status, 
          url: response.config.url,
        }, 'Response received');
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url;
        
        if (status === 401) {
          logger.error({ url }, 'API key invalid or expired');
        } else if (status === 403) {
          logger.error({ url }, 'API key expired — check cloud.ave.ai');
        } else if (status === 429) {
          logger.warn({ url }, 'Rate limit exceeded');
        } else {
          logger.warn({ status, url, message: error.message }, 'Request failed');
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Universal GET/POST with retry and fallback.
   * Unwraps the AVE envelope: { status, msg, data_type, data } → returns data
   */
  async _request(options) {
    const execute = async (baseUrl) => {
      const response = await this.instance({ ...options, baseURL: baseUrl });
      
      // Unwrap AVE envelope
      const body = response.data;
      if (body && typeof body === 'object' && body.data !== undefined) {
        // Check for API-level errors
        if (body.msg && body.msg.includes('FAIL')) {
          logger.warn({ msg: body.msg, url: options.url }, 'AVE API returned failure');
          return body.data; // Still return data (might be empty {})
        }
        return body.data;
      }
      return body;
    };

    try {
      // Try primary with retry
      return await withRetry(() => execute(this.primaryUrl), { 
        maxRetries: 3, 
        onRetryMessage: `Retrying primary AVE API: ${options.url}` 
      });
    } catch (error) {
      logger.warn({ url: options.url }, 'Primary failed after all retries, switching to fallback');
      // Try fallback
      return await execute(this.fallbackUrl);
    }
  }

  /**
   * Fetches token prices and TVL.
   * POST /v2/tokens/price
   * Returns: { [tokenId]: { current_price_usd, tvl, ... } }
   */
  async getTokenPrices(tokenIds, tvlMin = 0) {
    return await this._request({
      method: 'post',
      url: '/v2/tokens/price',
      data: { token_ids: tokenIds, tvl_min: tvlMin }
    });
  }

  /**
   * Fetches token detail (includes top pairs for discovery).
   * GET /v2/tokens/{tokenId}
   * Returns: { token: {...}, pairs: [...], is_audited }
   */
  async getTokenDetail(tokenId) {
    return await this._request({
      method: 'get',
      url: `/v2/tokens/${tokenId}`
    });
  }

  /**
   * Fetches health metrics for a specific pair.
   * GET /v2/pairs/{pairId}
   * Returns: { pair, chain, reserve0, reserve1, tvl, price_change_1h, ... }
   */
  async getPairDetail(pairId) {
    return await this._request({
      method: 'get',
      url: `/v2/pairs/${pairId}`
    });
  }

  /**
   * Fetches liquidity transaction history for a pair.
   * GET /v2/txs/liq/{pairId}
   * Returns: { txs: [...], total_count, to_time, limit, pair_id }
   */
  async getLiquidityHistory(pairId, options = {}) {
    const { type = 'all', limit = 300, sort = 'desc' } = options;
    return await this._request({
      method: 'get',
      url: `/v2/txs/liq/${pairId}`,
      params: { type, limit, sort }
    });
  }

  /**
   * Fetches contract risk information.
   * GET /v2/contracts/{tokenId}
   * Returns: { analysis_risk_score, holders, token_lock_percent, ... }
   */
  async getContractRisk(tokenId) {
    return await this._request({
      method: 'get',
      url: `/v2/contracts/${tokenId}`
    });
  }

  /**
   * Fetches top smart wallets for a chain.
   * GET /v2/address/smart_wallet/list
   * Returns: Array of { wallet_address, total_profit, total_profit_rate, ... }
   */
  async getSmartWallets(chain) {
    return await this._request({
      method: 'get',
      url: '/v2/address/smart_wallet/list',
      params: { chain, sort: 'total_profit' }
    });
  }

  /**
   * Fetches Top 100 holders for a token.
   * GET /v2/tokens/top100/{tokenId}
   * Returns: Array of { address, percent, quantity, ... }
   */
  async getTop100Holders(tokenId) {
    return await this._request({
      method: 'get',
      url: `/v2/tokens/top100/${tokenId}`
    });
  }
}

export default new AveClient();

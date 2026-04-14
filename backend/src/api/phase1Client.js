/**
 * Phase 1 Client - Consumes signals and health data from Phase 1 REST server.
 * All methods are error-tolerant — they return safe defaults instead of throwing.
 */
import axios from 'axios';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('phase1-client');

class Phase1Client {
  constructor() {
    this.baseUrl = process.env.PHASE1_API_URL || 'http://localhost:3001';
    this.instance = axios.create({
      baseURL: this.baseUrl,
      timeout: 8000
    });
  }

  /**
   * Safe request wrapper — catches all errors and returns null.
   */
  async _safeGet(path, params) {
    try {
      const response = await this.instance.get(path, { params });
      return response.data;
    } catch (error) {
      logger.warn({ path, error: error.message }, 'Phase 1 request failed');
      return null;
    }
  }

  /**
   * Pings Phase 1 health endpoint.
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const response = await this.instance.get('/api/health');
      return response.data?.status === 'ok';
    } catch (error) {
      logger.error({ error: error.message }, 'Phase 1 is unreachable');
      return false;
    }
  }

  /**
   * Fetches net liquidity flow for a pair.
   * @returns {Promise<Object|null>} { removeLiquidityCount, addLiquidityCount, drainRatio, events }
   */
  async getLiquidityDrain(chain, pairAddress, windowMinutes = 60) {
    const data = await this._safeGet('/api/signals/liquidity-drain', { chain, pairAddress, windowMinutes });
    return data || { removeLiquidityCount: 0, addLiquidityCount: 0, drainRatio: 0, events: [] };
  }

  /**
   * Fetches historical TVL/Price snapshots.
   * @returns {Promise<Array>}
   */
  async getTvlHistory(chain, tokenAddress, limit = 90) {
    const data = await this._safeGet('/api/signals/tvl-history', { chain, tokenAddress, limit });
    return Array.isArray(data) ? data : [];
  }

  /**
   * Fetches latest pair health metrics.
   * @returns {Promise<Object|null>}
   */
  async getPairHealth(chain, pairAddress) {
    return await this._safeGet('/api/signals/pair-health', { chain, pairAddress });
  }

  /**
   * Computes price deviation from baseline.
   * @returns {Promise<Object|null>}
   */
  async getPriceDeviation(chain, tokenAddress, windowMinutes = 60) {
    const data = await this._safeGet('/api/signals/price-deviation', { chain, tokenAddress, windowMinutes });
    return data || { error: 'No data', currentPrice: 0, baselinePrice: 0, deviationPercent: 0 };
  }

  /**
   * Fetches aggregated swap volume stats.
   * @returns {Promise<Object|null>}
   */
  async getSellPressure(chain, pairAddress, windowMinutes = 60) {
    return await this._safeGet('/api/signals/sell-pressure', { chain, pairAddress, windowMinutes });
  }

  /**
   * Fetches latest contract risk score.
   * @returns {Promise<Object|null>}
   */
  async getContractRisk(chain, tokenAddress) {
    return await this._safeGet('/api/signals/contract-risk', { chain, tokenAddress });
  }
}

export default new Phase1Client();

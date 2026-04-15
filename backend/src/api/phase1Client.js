/**
 * Phase 1 Client - Consumes signals and health data.
 * REFACTORED: Now calls internal repositories directly instead of via REST.
 * This ensures reliability in a unified server architecture.
 */
import signalRepo from '../../contagion-shield/src/database/repositories/signalRepo.js';
import liquidityRepo from '../../contagion-shield/src/database/repositories/liquidityRepo.js';
import pairRepo from '../../contagion-shield/src/database/repositories/pairRepo.js';
import swapRepo from '../../contagion-shield/src/database/repositories/swapRepo.js';
import config from '../../contagion-shield/src/config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('phase1-client');

class Phase1Client {
  /**
   * Pings Phase 1 health status (now always true as it's internal).
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    return true;
  }

  /**
   * Fetches net liquidity flow for a pair.
   * @returns {Promise<Object>}
   */
  async getLiquidityDrain(chain, pairAddress, windowMinutes = 60) {
    try {
      const windowMs = (parseInt(windowMinutes) || config.DEFAULTS.WINDOW_MINUTES) * 60 * 1000;
      const stats = await liquidityRepo.getLiquidityDrainStats(chain, pairAddress, windowMs);
      return stats || { removeLiquidityCount: 0, addLiquidityCount: 0, drainRatio: 0, events: [] };
    } catch (err) {
      logger.error({ pairAddress, error: err.message }, 'Failed to get liquidity drain');
      return { removeLiquidityCount: 0, addLiquidityCount: 0, drainRatio: 0, events: [] };
    }
  }

  /**
   * Fetches historical TVL/Price snapshots.
   * @returns {Promise<Array>}
   */
  async getTvlHistory(chain, tokenAddress, limit = 90) {
    try {
      const queryLimit = parseInt(limit) || config.DEFAULTS.QUERY_LIMIT;
      const history = await signalRepo.getPriceHistory(chain, tokenAddress, queryLimit);
      return Array.isArray(history) ? history : [];
    } catch (err) {
      logger.error({ tokenAddress, error: err.message }, 'Failed to get TVL history');
      return [];
    }
  }

  /**
   * Fetches latest pair health metrics.
   * @returns {Promise<Object|null>}
   */
  async getPairHealth(chain, pairAddress) {
    try {
      return await pairRepo.getLatestPairSnapshot(chain, pairAddress);
    } catch (err) {
      logger.error({ pairAddress, error: err.message }, 'Failed to get pair health');
      return null;
    }
  }

  /**
   * Computes price deviation from baseline.
   * @returns {Promise<Object|null>}
   */
  async getPriceDeviation(chain, tokenAddress, windowMinutes = 60) {
    try {
      const windowMs = (parseInt(windowMinutes) || config.DEFAULTS.WINDOW_MINUTES) * 60 * 1000;
      const history = await signalRepo.getPriceHistory(chain, tokenAddress, 100);
      const baseline = await signalRepo.getBaselinePrice(chain, tokenAddress, windowMs);
      
      if (!history.length || !baseline) return { error: 'No data', currentPrice: 0, baselinePrice: 0, deviationPercent: 0 };
      
      const currentPrice = history[0].price_usd;
      const baselinePrice = baseline.price_usd;
      const deviationPercent = ((currentPrice - baselinePrice) / baselinePrice) * 100;

      return {
        tokenAddress,
        symbol: history[0].symbol,
        currentPrice,
        baselinePrice,
        deviationPercent,
        snapshots: history
      };
    } catch (err) {
      logger.error({ tokenAddress, error: err.message }, 'Failed to get price deviation');
      return { error: 'Error', currentPrice: 0, baselinePrice: 0, deviationPercent: 0 };
    }
  }

  /**
   * Fetches aggregated swap volume stats.
   * @returns {Promise<Object|null>}
   */
  async getSellPressure(chain, pairAddress, windowMinutes = 60) {
    try {
      const windowMs = (parseInt(windowMinutes) || config.DEFAULTS.WINDOW_MINUTES) * 60 * 1000;
      return await swapRepo.getSellPressureStats(chain, pairAddress, windowMs);
    } catch (err) {
      logger.error({ pairAddress, error: err.message }, 'Failed to get sell pressure');
      return null;
    }
  }

  /**
   * Fetches latest contract risk score.
   * @returns {Promise<Object|null>}
   */
  async getContractRisk(chain, tokenAddress) {
    try {
      return await signalRepo.getLatestContractRisk(chain, tokenAddress);
    } catch (err) {
      logger.error({ tokenAddress, error: err.message }, 'Failed to get contract risk');
      return null;
    }
  }
}

export default new Phase1Client();

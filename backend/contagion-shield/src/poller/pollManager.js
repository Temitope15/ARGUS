/**
 * Poll Manager - Orchestrates all scheduled REST API polling jobs.
 */
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import tvlPoller from './tvlPoller.js';
import pairPoller from './pairPoller.js';
import riskScorePoller from './riskScorePoller.js';
import pairDiscoveryPoller from './pairDiscoveryPoller.js';

const logger = createLogger('poll-manager');

class PollManager {
  constructor() {
    this.intervals = [];
  }

  /**
   * Start all registered pollers
   */
  /**
   * Starts all polling jobs according to configured intervals.
   * @returns {Promise<void>}
   */
  async start() {
    logger.info('Starting polling manager...');
    
    // 1. TVL Poller - 60s
    this._schedule(tvlPoller, config.intervals.tvl, 'TVL Poller');
    
    // 2. Pair Poller - 60s (staggered 30s after TVL)
    setTimeout(() => {
      this._schedule(pairPoller, config.intervals.pair, 'Pair Poller');
    }, 30000);
    
    // 3. Risk Score Poller - 5m
    this._schedule(riskScorePoller, config.intervals.risk, 'Risk Score Poller');
    
    // 4. Pair Discovery Poller - Startup + 6h
    // We already run discovery at startup in src/index.js, 
    // here we just schedule the recurrence.
    this._schedule(pairDiscoveryPoller, config.intervals.discovery, 'Discovery Poller');
    
    logger.info('All polling jobs scheduled');
  }

  _schedule(poller, intervalMs, name) {
    const interval = setInterval(async () => {
      try {
        await poller.run();
      } catch (error) {
        logger.error({ error: error.message }, `${name} failed`);
      }
    }, intervalMs);
    
    this.intervals.push(interval);
  }

  /**
   * Stops all polling jobs and clears intervals.
   * @returns {void}
   */
  stop() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    logger.info('Polling manager stopped');
  }
}

export default new PollManager();

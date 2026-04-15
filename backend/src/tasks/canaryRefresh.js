/**
 * Canary Refresh Task - Periodically updates the "Smart Wallet" list from AVE.
 * Frequency: Every 6 hours
 * 
 * AVE /v2/address/smart_wallet/list returns (after unwrap):
 * Array of { wallet_address, total_profit, total_profit_rate, chain, ... }
 */
import aveRestClient from '../api/aveRestClient.js';
import db from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('task/canary-refresh');

/**
 * Runs the refresh cycle for a specific chain.
 */
export async function refreshCanaries(chain) {
  try {
    logger.info({ chain }, 'Refreshing canary wallet list...');
    
    const { data, error } = await aveRestClient.getSmartWallets(chain);
    
    if (error || !data) {
      logger.warn({ error, chain }, 'Failed to fetch smart wallets');
      return;
    }

    // data is now a flat array (after AVE envelope unwrap)
    const walletList = Array.isArray(data) ? data : [];
    
    if (walletList.length === 0) {
      logger.warn({ chain }, 'No smart wallets returned');
      return;
    }

    // Top 50 smart wallets
    const top50 = walletList.slice(0, 50);
    const now = Date.now();

    const batchStmts = top50.map(wallet => ({
      sql: `INSERT INTO canary_wallets (address, chain, total_profit, total_profit_rate, refreshed_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(address, chain) DO UPDATE SET 
              total_profit=excluded.total_profit, 
              total_profit_rate=excluded.total_profit_rate, 
              refreshed_at=excluded.refreshed_at`,
      args: [
        wallet.wallet_address,
        chain, 
        wallet.total_profit || 0, 
        wallet.total_profit_rate || 0, 
        now
      ]
    }));

    if (batchStmts.length > 0) {
      await db.batch(batchStmts, 'write');
    }
    logger.info({ count: top50.length, chain }, 'Canary wallets updated');

  } catch (error) {
    logger.error({ error: error.message, chain }, 'Canary refresh failed');
  }
}

export default { refreshCanaries };

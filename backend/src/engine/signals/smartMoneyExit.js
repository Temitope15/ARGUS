/**
 * Signal 4: Smart Money Exit - Detects canary wallets removing liquidity.
 */
import db from '../../database/phase2Db.js';
import phase1Client from '../../api/phase1Client.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('signal/smart-money');

/**
 * Computes Smart Money Exit score points.
 */
export async function computeSmartMoneyExit(chain, protocolId, pairAddress) {
  try {
    // 1. Get detected exits for this protocol from DB (canary_exits table)
    // We only care about recent exits (e.g. last 60 min)
    const now = Date.now();
    const windowMs = 60 * 60 * 1000;
    const since = now - windowMs;

    const result = await db.execute({
      sql: `SELECT * FROM canary_exits 
            WHERE protocol_id = ? AND occurred_at >= ?`,
      args: [protocolId, since]
    });
    const recentExits = result.rows;

    if (recentExits.length === 0) return { pts: 0, exits: [], skipped: false };

    // 2. Apply decay formula for each exit
    // decayedPts = Math.max(0, 20 - (4 * Math.floor(minutesSinceExit / 15)))
    let totalPts = 0;
    
    recentExits.forEach(exit => {
      const minutesSinceExit = Math.floor((now - exit.occurred_at) / (60 * 1000));
      const decayedPts = Math.max(0, 20 - (4 * Math.floor(minutesSinceExit / 15)));
      
      // Multiple canary exits stack but cap at 20
      totalPts += decayedPts;
    });

    const cappedPts = Math.min(20, totalPts);

    return { 
      pts: cappedPts, 
      exitCount: recentExits.length,
      exits: recentExits,
      skipped: false 
    };

  } catch (error) {
    logger.error({ error: error.message, protocolId }, 'Failed to compute Smart Money Exit score');
    return { pts: 0, exits: [], skipped: true, error: error.message };
  }
}

/**
 * Scans Phase 1 liquidity events for canary wallet matches.
 * This should be called by the poll cycle before computeSmartMoneyExit.
 */
export async function scanForCanaryExits(chain, protocolId, pairAddress) {
  try {
    const data = await phase1Client.getLiquidityDrain(chain, pairAddress, 60);
    if (!data || !data.events) return;

    // Get all canary wallets for this chain
    const result = await db.execute({
      sql: 'SELECT address FROM canary_wallets WHERE chain = ?',
      args: [chain]
    });
    const canaries = result.rows;
    const canarySet = new Set(canaries.map(c => c.address.toLowerCase()));

    for (const event of data.events) {
      if (event.event_type === 'removeLiquidity' && canarySet.has(event.walletAddress?.toLowerCase())) {
        // Detected smart money exit!
        // amount_usd > $5,000 threshold
        if (event.amountUsd > 5000) {
          logger.warn({ 
            wallet: event.walletAddress, 
            amount: event.amountUsd,
            protocolId
          }, 'Canary wallet exit detected!');

          const existingRes = await db.execute({
            sql: 'SELECT id FROM canary_exits WHERE id = ?',
            args: [event.txHash]
          });
          
          await db.execute({
            sql: `INSERT INTO canary_exits (wallet_address, protocol_id, amount_usd, occurred_at)
                  VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING`,
            args: [event.walletAddress, protocolId, event.amountUsd, event.timestamp]
          });
        }
      }
    }
  } catch (error) {
    logger.error({ error: error.message, protocolId }, 'Canary exit scan failed');
  }
}

export default computeSmartMoneyExit;

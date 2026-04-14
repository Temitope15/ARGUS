/**
 * Holder Surveillance Task - Monitors top 100 holders for massive exits.
 * Frequency: Every 60 minutes
 * 
 * AVE /v2/tokens/top100/{tokenId} returns (after unwrap):
 * Array of { address, percent, quantity, is_contract, mark }
 * — Note: `percent` (not `ratio`), `quantity` (not `amount_usd`)
 */
import aveRestClient from '../api/aveRestClient.js';
import db from '../database/phase2Db.js';
import socketServer from '../broadcast/socketServer.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('task/holder-surveillance');

/**
 * Runs surveillance on a specific token.
 */
export async function runHolderSurveillance(tokenId) {
  try {
    logger.debug({ tokenId }, 'Running holder surveillance...');
    
    const { data, error } = await aveRestClient.getTop100Holders(tokenId);
    
    if (error || !data) {
      logger.warn({ error, tokenId }, 'Failed to fetch top holders (may not be available for this token)');
      return;
    }

    // data is a flat array after envelope unwrap
    const holders = Array.isArray(data) ? data : [];
    
    if (holders.length === 0) {
      logger.debug({ tokenId }, 'No holders data available');
      return;
    }

    const now = Date.now();

    // 1. Get previous snapshot (approx 60 min ago)
    const prevSnapTime = now - (65 * 60 * 1000); // 65 min buffer
    const prevHolders = db.prepare(`
      SELECT * FROM holder_snapshots 
      WHERE token_id = ? AND snapshotted_at >= ?
      ORDER BY snapshotted_at DESC
    `).all(tokenId, prevSnapTime);

    // Group by address for easy comparison
    const prevMap = new Map(prevHolders.map(h => [h.holder_address.toLowerCase(), h]));

    // 2. Cross-reference top 10
    const top10 = holders.slice(0, 10);
    for (let i = 0; i < top10.length; i++) {
      const current = top10[i];
      if (!current.address) continue;
      
      const prev = prevMap.get(current.address.toLowerCase());
      
      if (prev) {
        const currentPercent = parseFloat(current.percent || 0);
        // reductionPct = (old - new) / old * 100
        const reductionPct = ((prev.balance_ratio - currentPercent) / prev.balance_ratio) * 100;

        if (reductionPct > 20) {
          logger.warn({
            token: tokenId,
            wallet: current.address.substring(0, 12),
            reduction: reductionPct.toFixed(2),
            rank: i + 1
          }, 'Top-10 holder exit detected!');

          // Broadcast as high-severity signal event
          socketServer.broadcastSignal({
            type: "holder_exit",
            description: `Top-10 holder (rank ${i + 1}) reduced balance by ${reductionPct.toFixed(1)}%`,
            tokenId,
            severity: "high"
          });
        }
      }
    }

    // 3. Persist new snapshot
    const insert = db.prepare(`
      INSERT INTO holder_snapshots (token_id, holder_address, balance_ratio, balance_usd, rank, snapshotted_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((list) => {
      for (let i = 0; i < list.length; i++) {
        const h = list[i];
        if (!h.address) continue;
        insert.run(
          tokenId, 
          h.address, 
          parseFloat(h.percent || 0),       // percent not ratio
          parseFloat(h.quantity || 0),       // quantity not amount_usd (token units)
          i + 1,                             // rank from position, not h.rank
          now
        );
      }
    });

    transaction(holders);
    
    // Cleanup old snapshots (>24h)
    db.prepare('DELETE FROM holder_snapshots WHERE snapshotted_at < ?').run(now - (24 * 60 * 60 * 1000));
    
    logger.debug({ tokenId, holdersTracked: holders.length }, 'Holder surveillance complete');

  } catch (error) {
    logger.error({ error: error.message, tokenId }, 'Holder surveillance failed');
  }
}

export default { runHolderSurveillance };

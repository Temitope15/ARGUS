/**
 * TVL Repository - Persistence for price and TVL snapshots.
 */
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const tvlRepo = {
  /**
   * Persists a normalized price/TVL snapshot.
   * @param {Object} snapshot - The normalized PriceSnapshot object.
   * @returns {Object} Database run result.
   */
  savePriceSnapshot: async (snapshot) => {
    return await db.execute({
      sql: `INSERT INTO price_snapshots (
        id, timestamp, chain, token_address, symbol, 
        price_usd, tvl, price_change_1h, price_change_24h, 
        volume_u_24h, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        snapshot.id || uuidv4(),
        snapshot.timestamp,
        snapshot.chain,
        snapshot.tokenAddress,
        snapshot.symbol,
        snapshot.priceUsd,
        snapshot.tvl,
        snapshot.priceChange1h,
        snapshot.priceChange24h,
        snapshot.volumeU24h,
        snapshot.source
      ]
    });
  },
  
  /**
   * Persists a normalized contract risk record.
   * @param {Object} risk - The normalized ContractRisk object.
   * @returns {Object} Database run result.
   */
  saveContractRisk: async (risk) => {
    return await db.execute({
      sql: `INSERT INTO contract_risks (
        id, timestamp, chain, token_address, 
        analysis_risk_score, holders, lock_percent, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        risk.id || uuidv4(),
        risk.timestamp,
        risk.chain,
        risk.tokenAddress,
        risk.analysisRiskScore,
        risk.holders,
        risk.lockPercent,
        risk.source
      ]
    });
  }
};

export default tvlRepo;

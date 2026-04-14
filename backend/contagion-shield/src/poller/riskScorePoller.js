/**
 * Risk Score Poller - Polls contract risk information for monitored tokens.
 * 
 * API: GET /v2/contracts/{tokenId}
 * Response (after unwrap): { analysis_risk_score, holders, token_lock_percent, ... }
 */
import aveClient from '../api/aveClient.js';
import eventNormalizer from '../normalizer/eventNormalizer.js';
import tvlRepo from '../database/repositories/tvlRepo.js';
import signalRepo from '../database/repositories/signalRepo.js';
import { protocols } from '../config/protocols.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('risk-poller');

/**
 * Runs the contract risk polling cycle for all monitored tokens.
 * @returns {Promise<void>}
 */
const run = async () => {
  try {
    logger.debug('Polling contract risk scores...');
    
    for (const protocol of protocols) {
      const tokenId = `${protocol.address}-${protocol.chain}`;
      try {
        const data = await aveClient.getContractRisk(tokenId);
        
        if (!data || typeof data !== 'object' || !data.analysis_risk_score) {
          logger.debug({ token: protocol.symbol }, 'No risk data returned');
          continue;
        }
        
        const normalized = eventNormalizer.normalizeContractRisk(data, tokenId);
        if (!normalized) continue;
        
        // Check for risk escalation
        const lastRisk = await signalRepo.getLatestContractRisk(protocol.chain, protocol.address);
        if (lastRisk && normalized.analysisRiskScore > lastRisk.analysis_risk_score + 5) {
          logger.warn({
            token: protocol.symbol,
            oldScore: lastRisk.analysis_risk_score,
            newScore: normalized.analysisRiskScore
          }, 'CRITICAL: Risk score increased significantly!');
        }

        await tvlRepo.saveContractRisk(normalized);
        
        logger.debug({
          token: protocol.symbol,
          riskScore: normalized.analysisRiskScore,
          holders: normalized.holders
        }, 'Risk score saved');
        
      } catch (err) {
        logger.error({ token: protocol.symbol, error: err.message }, 'Failed to poll risk for token');
      }
    }
    
    logger.info('Risk score poll complete');
    
  } catch (error) {
    logger.error({ error: error.message }, 'Risk poller failed');
    throw error;
  }
};

export default { run };

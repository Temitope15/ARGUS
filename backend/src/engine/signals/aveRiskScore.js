/**
 * Signal 5: AVE Risk Score Spike - Measures spikes in contract risk.
 */
import phase1Client from '../../api/phase1Client.js';
import db from '../../database/phase2Db.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('signal/risk-spike');

/**
 * Computes AVE Risk Score points.
 */
export async function computeAveRiskScore(chain, protocolId, tokenAddress) {
  try {
    const data = await phase1Client.getContractRisk(chain, tokenAddress);
    
    if (!data || data.error) {
      return { pts: 0, score: 0, skipped: true };
    }

    const currentScore = data.analysis_risk_score || 0;
    
    // 1. Get previous reading from scores table
    const lastEvaluation = db.prepare(`
      SELECT signal_ave_risk_pts, score FROM scores 
      WHERE protocol_id = ? 
      ORDER BY computed_at DESC LIMIT 1
    `).get(protocolId);

    // 2. Base pts calculation
    let pts = 0;
    if (currentScore >= 70) pts = 10;
    else if (currentScore >= 50) pts = 5;

    // 3. Spike detection: if (currentScore - lastScore) > 20
    const prevScore = lastEvaluation ? lastEvaluation.score : 0; // Simplified - actually need the raw AVE score from last time
    // For now, let's assume we store the raw score in a metadata field or just use the pts spike
    
    // Better Spike Detection - query direct from contract_risks table (Phase 1 table)
    const prevRisk = db.prepare(`
      SELECT analysis_risk_score FROM contract_risks 
      WHERE chain = ? AND token_address = ? AND timestamp < ?
      ORDER BY timestamp DESC LIMIT 1
    `).get(chain, tokenAddress, Date.now() - 1000); // 1s ago

    if (prevRisk && (currentScore - prevRisk.analysis_risk_score) > 20) {
      logger.warn({ 
        protocolId, 
        old: prevRisk.analysis_risk_score, 
        new: currentScore 
      }, 'AVE risk score spike detected!');
      // Spike logic could add extra pts or trigger re-eval, but brief says 10pts max for signal.
      // The "trigger immediate re-eval" is handled by the pollCycle.
    }

    return { 
      pts, 
      riskScore: currentScore,
      skipped: false 
    };

  } catch (error) {
    logger.error({ error: error.message, tokenAddress }, 'Failed to compute Risk Score points');
    return { pts: 0, riskScore: 0, skipped: true, error: error.message };
  }
}

export default computeAveRiskScore;

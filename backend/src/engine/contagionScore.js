/**
 * Contagion Score - Aggregates signals and applies systemic multipliers.
 */
import { createLogger } from '../utils/logger.js';

const logger = createLogger('engine/contagion-score');

/**
 * Aggregates points from all 5 signals into a 0-100 score.
 * 
 * @param {Object} results - Results from all 5 signal computations.
 * @returns {Object} Final score object with alertLevel.
 */
export function aggregateScore(results) {
  const { tvl, lp, depeg, smartMoney, aveRisk } = results;

  const totalPts = tvl.pts + lp.pts + depeg.pts + smartMoney.pts + aveRisk.pts;
  
  // Cap at 100
  let finalScore = Math.min(100, totalPts);

  // Confidence check: If fewer than 3 signals have data
  const successfulSignals = [tvl, lp, depeg, smartMoney, aveRisk].filter(s => !s.skipped).length;
  const lowConfidence = successfulSignals < 3;

  return {
    score: finalScore,
    alertLevel: determineLevel(finalScore),
    lowConfidence,
    signals: {
      tvlVelocityPts: tvl.pts,
      lpDrainRatePts: lp.pts,
      stablecoinDepegPts: depeg.pts,
      smartMoneyExitPts: smartMoney.pts,
      aveRiskScorePts: aveRisk.pts
    }
  };
}

/**
 * Applies the systemic Contagion Multiplier (1.5x) if multiple protocols are in distress.
 * 
 * @param {Array<Object>} protocolScores - Array of aggregated score objects for all protocols.
 * @returns {Array<Object>} Updated protocol scores.
 */
export function applyContagionMultiplier(protocolScores) {
  // ORANGE or above is score >= 46
  const orangeOrAbove = protocolScores.filter(s => s.score >= 46);

  if (orangeOrAbove.length >= 2) {
    // Find the highest score to apply multiplier to (key differentiator)
    // Or apply to all orange/above? The brief says: "highest.score = Math.min(100, Math.round(highest.score * 1.5))"
    const highest = protocolScores.reduce((a, b) => a.score > b.score ? a : b);
    
    // Skip if already at 100
    if (highest.score < 100) {
      const oldScore = highest.score;
      highest.score = Math.min(100, Math.round(highest.score * 1.5));
      highest.contagionMultiplierApplied = true;
      highest.alertLevel = determineLevel(highest.score);

      logger.warn({
        message: 'CONTAGION MULTIPLIER ACTIVATED',
        protocolsInDistress: orangeOrAbove.map(s => s.protocolId),
        affectedProtocol: highest.protocolId,
        scoreBefore: oldScore,
        scoreAfter: highest.score
      }, 'Systemic risk detected across multiple protocols');
    }
  }

  return protocolScores;
}

/**
 * Determines the alert level based on the current score.
 */
function determineLevel(score) {
  if (score >= 71) return 'RED';
  if (score >= 46) return 'ORANGE';
  if (score >= 21) return 'YELLOW';
  return 'GREEN';
}

export default { aggregateScore, applyContagionMultiplier };

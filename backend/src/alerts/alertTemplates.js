/**
 * Alert Templates - Formats rich Markdown messages for Telegram.
 */

export const getTemplate = (level, data) => {
  const { protocolName, chain, score, contagionMultiplierApplied, signalResults } = data;
  
  const header = _getHeader(level, protocolName, chain, score, contagionMultiplierApplied);
  const body = _formatSignalBreakdown(signalResults || {});
  const footer = _getFooter(level);
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return `${header}\n\n${body}\n\n${footer}\n\n_${timestamp} UTC — ARGUS Shield_`;
};

function _getHeader(level, name, chain, score, contagion) {
  const emoji = {
    GREEN: '✅',
    YELLOW: '🟡',
    ORANGE: '🟠',
    RED: '🔴'
  }[level] || '❓';

  const status = level === 'GREEN' ? 'RESOLVED' : `${level} ALERT`;
  const severity = level === 'RED' ? '🚨🚨🚨' : level === 'ORANGE' ? '⚠️' : '';

  let header = `${severity}${emoji} *${status}* — ${name}`;
  header += `\n📍 Chain: ${chain.toUpperCase()}`;
  header += `\n📊 Risk Score: *${score}/100*`;
  
  if (contagion) {
    header += '\n⚡ *CONTAGION MULTIPLIER ACTIVE* — Multiple protocols in distress';
  }

  return header;
}

function _formatSignalBreakdown(signals) {
  const lines = [];
  
  if (signals.tvlVelocityPts > 0) {
    lines.push(`📉 TVL dropping: *${signals.tvlVelocityPts} pts*`);
  }
  if (signals.lpDrainRatePts > 0) {
    lines.push(`💧 LP drain spike: *${signals.lpDrainRatePts} pts*`);
  }
  if (signals.stablecoinDepegPts > 0) {
    lines.push(`💱 Stablecoin de-peg: *${signals.stablecoinDepegPts} pts*`);
  }
  if (signals.smartMoneyExitPts > 0) {
    lines.push(`🐋 Smart money exiting: *${signals.smartMoneyExitPts} pts*`);
  }
  if (signals.aveRiskScorePts > 0) {
    lines.push(`🔍 Contract risk elevated: *${signals.aveRiskScorePts} pts*`);
  }

  if (lines.length === 0) return '✅ No critical signals. All metrics healthy.';
  
  return `*Signals Detected:*\n${lines.join('\n')}`;
}

function _getFooter(level) {
  if (level === 'RED') {
    return `*🚨 Recommended Action:*\nImmediately review your exposure to this protocol. Consider withdrawing or hedging.`;
  }
  if (level === 'ORANGE') {
    return `*⚠️ Recommended Action:*\nReduce exposure. Set stop-losses. Monitor closely.`;
  }
  if (level === 'YELLOW') {
    return `*🟡 Recommendation:*\nMonitor closely. No immediate action required.`;
  }
  return '🛡️ ARGUS continues 24/7 monitoring.';
}

export default { getTemplate };

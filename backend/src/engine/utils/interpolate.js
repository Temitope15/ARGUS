/**
 * Interpolation Utility - Linearly maps values to score points.
 */

/**
 * Linearly maps a `value` to a point score between minPts and maxPts,
 * based on where value falls between minThreshold and maxThreshold.
 * 
 * @param {number} value - The input value to map.
 * @param {number} minThreshold - Lower bound threshold.
 * @param {number} maxThreshold - Upper bound threshold.
 * @param {number} minPts - Points to award at minThreshold.
 * @param {number} maxPts - Points to award at maxThreshold.
 * @returns {number} Interpolated score (rounded).
 */
export function interpolateScore(value, minThreshold, maxThreshold, minPts, maxPts) {
  if (value <= minThreshold) return 0;
  if (value >= maxThreshold) return maxPts;
  
  const ratio = (value - minThreshold) / (maxThreshold - minThreshold);
  return Math.round(minPts + ratio * (maxPts - minPts));
}

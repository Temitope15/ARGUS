/**
 * TVL Velocity Signal Tests
 */
import test from 'node:test';
import assert from 'node:assert';
import { interpolateScore } from '../../src/engine/utils/interpolate.js';

test('Signal 1: TVL Velocity interpolation', () => {
  // -8% drop should result in ~13-14 pts (Interpolated between 5%=10pts and 15%=25pts)
  // Range is 10pts wide (15-5=10), Pts range is 15pts wide (25-10=15)
  // Ratio for 8% is (8-5)/(15-5) = 0.3
  // Expected pts: 10 + (0.3 * 15) = 14.5 -> 15 (rounded)
  const pts8 = interpolateScore(8, 5, 15, 10, 25);
  assert.strictEqual(pts8, 15);

  // -20% drop (maxes out)
  const pts20 = interpolateScore(20, 5, 15, 10, 25);
  assert.strictEqual(pts20, 25);

  // -4% drop (below threshold)
  const pts4 = interpolateScore(4, 5, 15, 10, 25);
  assert.strictEqual(pts4, 0);
});

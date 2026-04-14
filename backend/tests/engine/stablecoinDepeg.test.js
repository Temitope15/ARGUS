/**
 * Stablecoin Depeg Signal Tests
 */
import test from 'node:test';
import assert from 'node:assert';
import { interpolateScore } from '../../src/engine/utils/interpolate.js';

test('Signal 3: Stablecoin Depeg interpolation', () => {
  // $0.9941 -> 0.59% de-peg -> max out at 20pts
  const pts59 = interpolateScore(0.59, 0.2, 0.5, 5, 20);
  assert.strictEqual(pts59, 20);

  // $0.999 -> 0.1% de-peg -> 0pts
  const pts10 = interpolateScore(0.1, 0.2, 0.5, 5, 20);
  assert.strictEqual(pts10, 0);

  // $0.9965 -> 0.35% de-peg -> should be around 12-13 pts
  const pts35 = interpolateScore(0.35, 0.2, 0.5, 5, 20);
  // (0.35-0.2)/(0.5-0.2) = 0.5 ratio. 5 + (0.5 * 15) = 12.5 -> 13
  assert.strictEqual(pts35, 13);
});

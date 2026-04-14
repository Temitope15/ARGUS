/**
 * LP Drain Rate Signal Tests
 */
import test from 'node:test';
import assert from 'node:assert';
import { interpolateScore } from '../../src/engine/utils/interpolate.js';

test('Signal 2: LP Drain Rate interpolation', () => {
  // 12.5x ratio -> should max out at 25pts (Threshold 10x)
  const pts12 = interpolateScore(12.5, 3, 10, 15, 25);
  assert.strictEqual(pts12, 25);

  // 3x ratio -> 15pts (Threshold 3x)
  const pts3 = interpolateScore(3, 3, 10, 15, 25);
  assert.strictEqual(pts3, 15);

  // 1x ratio -> 0pts
  const pts1 = interpolateScore(1, 3, 10, 15, 25);
  assert.strictEqual(pts1, 0);
});

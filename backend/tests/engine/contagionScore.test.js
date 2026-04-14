/**
 * Contagion Score & Multiplier Tests
 */
import test from 'node:test';
import assert from 'node:assert';
import { aggregateScore, applyContagionMultiplier } from '../../src/engine/contagionScore.js';

test('Contagion Score: Multiplier Logic', () => {
  const protocolScores = [
    {
      protocolId: 'A',
      score: 48, // Orange
      alertLevel: 'ORANGE'
    },
    {
      protocolId: 'B',
      score: 52, // Orange
      alertLevel: 'ORANGE'
    },
    {
      protocolId: 'C',
      score: 10, // Green
      alertLevel: 'GREEN'
    }
  ];

  const results = applyContagionMultiplier(protocolScores);
  
  // Highest score (B: 52) should be multiplied by 1.5x
  // 52 * 1.5 = 78
  const scoreB = results.find(p => p.protocolId === 'B');
  assert.strictEqual(scoreB.score, 78);
  assert.strictEqual(scoreB.alertLevel, 'RED');
  assert.strictEqual(scoreB.contagionMultiplierApplied, true);

  // Score A (48) should remain unchanged (multiplier applied only to highest)
  const scoreA = results.find(p => p.protocolId === 'A');
  assert.strictEqual(scoreA.score, 48);
});

test('Contagion Score: Single Protocol Orange', () => {
  const protocolScores = [
    {
      protocolId: 'A',
      score: 55,
      alertLevel: 'ORANGE'
    },
    {
      protocolId: 'C',
      score: 10,
      alertLevel: 'GREEN'
    }
  ];

  const results = applyContagionMultiplier(protocolScores);
  
  // No multiplier if only 1 is orange
  const scoreA = results.find(p => p.protocolId === 'A');
  assert.strictEqual(scoreA.score, 55);
  assert.strictEqual(scoreA.contagionMultiplierApplied, undefined);
});

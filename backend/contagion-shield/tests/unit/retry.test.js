/**
 * Unit tests for Retry Utility.
 */
import test from 'node:test';
import assert from 'node:assert';
import { withRetry } from '../../src/utils/retry.js';

test('withRetry should succeed on first attempt', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    return 'success';
  };

  const result = await withRetry(fn);
  
  assert.strictEqual(result, 'success');
  assert.strictEqual(attempts, 1);
});

test('withRetry should retry on failure and eventually succeed', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 3) throw new Error('Fail');
    return 'success';
  };

  const result = await withRetry(fn, { initialDelay: 10 });
  
  assert.strictEqual(result, 'success');
  assert.strictEqual(attempts, 3);
});

test('withRetry should throw after max retries', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    throw new Error('Persistent Failure');
  };

  try {
    await withRetry(fn, { maxRetries: 2, initialDelay: 10 });
    assert.fail('Should have thrown');
  } catch (error) {
    assert.strictEqual(error.message, 'Persistent Failure');
    assert.strictEqual(attempts, 3); // 1 initial + 2 retries
  }
});

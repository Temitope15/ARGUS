/**
 * Unit tests for Event Normalizer.
 */
import test from 'node:test';
import assert from 'node:assert';
import eventNormalizer from '../../src/normalizer/eventNormalizer.js';

test('normalizeLiquidity should correctly map raw data', async () => {
  const raw = {
    time: 1713000000,
    chain: 'eth',
    pair: '0x123',
    from_symbol: 'USDC',
    to_symbol: 'ETH',
    from_amount_usd: '1000',
    event_type: 'addLiquidity',
    sender: '0xabc',
    tx_id: '0xhash',
    block_number: '12345'
  };

  const normalized = eventNormalizer.normalizeLiquidity(raw);

  assert.strictEqual(normalized.chain, 'eth');
  assert.strictEqual(normalized.pairAddress, '0x123');
  assert.strictEqual(normalized.amountUsd, 1000);
  assert.strictEqual(normalized.eventType, 'addLiquidity');
  assert.strictEqual(normalized.timestamp, 1713000000000);
});

test('normalizePriceSnapshot should handle various sources', async () => {
  const raw = {
    price: 1.0,
    tvl: 1000000,
    symbol: 'USDC',
    address: '0xusdc'
  };

  const normalized = eventNormalizer.normalizePriceSnapshot(raw, 'websocket');
  
  assert.strictEqual(normalized.priceUsd, 1.0);
  assert.strictEqual(normalized.tvl, 1000000);
  assert.strictEqual(normalized.source, 'websocket');
});

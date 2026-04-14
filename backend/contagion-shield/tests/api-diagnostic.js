/**
 * AVE API Diagnostic Script
 * Hits every endpoint once and logs the raw response structure.
 * Run: node tests/api-diagnostic.js
 */
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_KEY = process.env.AVE_API_KEY;
const BASE_URL = 'https://prod.ave-api.com';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'X-API-KEY': API_KEY,
    'Content-Type': 'application/json'
  }
});

// Test tokens/pairs
const USDC_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const DAI_ETH = '0x6b175474e89094c44da98b954eedeac495271d0f';
const USDT_BSC = '0x55d398326f99059ff775485246999027b3197955';

function logShape(label, data, depth = 3) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📡 ${label}`);
  console.log('='.repeat(70));
  
  if (data === null || data === undefined) {
    console.log('  Response: null/undefined');
    return;
  }

  // Show top-level keys
  if (typeof data === 'object') {
    console.log(`  Type: ${Array.isArray(data) ? 'Array' : 'Object'}`);
    if (Array.isArray(data)) {
      console.log(`  Length: ${data.length}`);
      if (data.length > 0) {
        console.log(`  First item keys: ${Object.keys(data[0]).join(', ')}`);
        console.log(`  First item sample:`);
        console.log(JSON.stringify(data[0], null, 2).split('\n').map(l => '    ' + l).join('\n'));
      }
    } else {
      console.log(`  Top-level keys: ${Object.keys(data).join(', ')}`);
      // Show nested structure
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val)) {
          console.log(`  data.${key}: Array[${val.length}]`);
          if (val.length > 0 && typeof val[0] === 'object') {
            console.log(`    First item keys: ${Object.keys(val[0]).join(', ')}`);
            console.log(`    First item sample:`);
            console.log(JSON.stringify(val[0], null, 2).split('\n').map(l => '      ' + l).join('\n'));
          }
        } else if (typeof val === 'object' && val !== null) {
          console.log(`  data.${key}: Object { ${Object.keys(val).join(', ')} }`);
          // One level deeper for nested objects
          for (const [k2, v2] of Object.entries(val)) {
            if (Array.isArray(v2)) {
              console.log(`    .${k2}: Array[${v2.length}]`);
              if (v2.length > 0 && typeof v2[0] === 'object') {
                console.log(`      First item keys: ${Object.keys(v2[0]).join(', ')}`);
                console.log(`      First item sample:`);
                console.log(JSON.stringify(v2[0], null, 2).split('\n').map(l => '        ' + l).join('\n'));
              }
            } else {
              const display = typeof v2 === 'string' ? v2.substring(0, 80) : v2;
              console.log(`    .${k2}: ${display}`);
            }
          }
        } else {
          const display = typeof val === 'string' ? val.substring(0, 100) : val;
          console.log(`  data.${key}: ${display}`);
        }
      }
    }
  }
}

async function testEndpoint(label, fn) {
  try {
    const result = await fn();
    logShape(label, result.data);
  } catch (err) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`❌ ${label} — FAILED`);
    console.log('='.repeat(70));
    console.log(`  Status: ${err.response?.status || 'N/A'}`);
    console.log(`  Message: ${err.message}`);
    if (err.response?.data) {
      console.log(`  Response body: ${JSON.stringify(err.response.data).substring(0, 500)}`);
    }
  }
}

async function run() {
  console.log('🔬 AVE API Diagnostic');
  console.log(`API Key: ${API_KEY?.substring(0, 8)}...`);
  console.log(`Base URL: ${BASE_URL}`);

  // 1. POST /v2/tokens/price — Batch token price + TVL
  await testEndpoint(
    '1. POST /v2/tokens/price (batch price + TVL)',
    () => client.post('/v2/tokens/price', {
      token_ids: [`${USDC_ETH}-eth`, `${DAI_ETH}-eth`, `${USDT_BSC}-bsc`],
      tvl_min: 0
    })
  );

  // 2. GET /v2/tokens/{tokenId} — Token detail (for pair discovery)
  await testEndpoint(
    '2. GET /v2/tokens/{tokenId} (token detail + pairs)',
    () => client.get(`/v2/tokens/${USDC_ETH}-eth`)
  );

  // 3. GET /v2/pairs/{pairId} — Pair health detail
  // We'll discover the pair address from test 2, but let's try a known Uniswap V3 USDC/WETH pair
  await testEndpoint(
    '3. GET /v2/pairs/{pairId} (pair health)',
    () => client.get(`/v2/pairs/${USDC_ETH}-eth`)  // Try token address as pair first to see error shape
  );

  // 4. GET /v2/contracts/{tokenId} — Contract risk
  await testEndpoint(
    '4. GET /v2/contracts/{tokenId} (contract risk)',
    () => client.get(`/v2/contracts/${USDC_ETH}-eth`)
  );

  // 5. GET /v2/txs/liq/{pairId} — Liquidity transactions
  await testEndpoint(
    '5. GET /v2/txs/liq/{pairId} (liquidity txs)',
    () => client.get(`/v2/txs/liq/${USDC_ETH}-eth`, { params: { type: 'all', limit: 5, sort: 'desc' } })
  );

  // 6. GET /v2/address/smart_wallet/list — Smart wallets
  await testEndpoint(
    '6. GET /v2/address/smart_wallet/list (smart wallets)',
    () => client.get('/v2/address/smart_wallet/list', { params: { chain: 'eth', sort: 'total_profit' } })
  );

  // 7. GET /v2/tokens/top100/{tokenId} — Top 100 holders
  await testEndpoint(
    '7. GET /v2/tokens/top100/{tokenId} (top holders)',
    () => client.get(`/v2/tokens/top100/${USDC_ETH}-eth`)
  );

  // 8. GET /v2/address/walletinfo/tokens — Wallet tokens (for dashboard positions)
  await testEndpoint(
    '8. GET /v2/address/walletinfo/tokens (wallet holdings)',
    () => client.get('/v2/address/walletinfo/tokens', { params: { wallet_address: '0x0000000000000000000000000000000000000000', chain: 'eth' } })
  );

  console.log('\n\n✅ Diagnostic complete. Use the shapes above to fix normalizer field mappings.');
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

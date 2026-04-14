/**
 * Protocols configuration - Defining target tokens to monitor.
 * Adding a new protocol is as simple as adding an entry to this list.
 */

export const protocols = [
  // Ethereum Mainnet
  {
    symbol: 'USDC',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    chain: 'eth',
    type: 'stablecoin',
  },
  {
    symbol: 'USDT',
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    chain: 'eth',
    type: 'stablecoin',
  },
  {
    symbol: 'DAI',
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    chain: 'eth',
    type: 'stablecoin',
  },
  
  // BSC
  {
    symbol: 'USDT', // BSC USDT
    address: '0x55d398326f99059ff775485246999027b3197955',
    chain: 'bsc',
    type: 'stablecoin',
  },
  {
    symbol: 'BUSD',
    address: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    chain: 'bsc',
    type: 'stablecoin',
  }
];

/**
 * Helper to get token IDs in the format expected by some AVE endpoints (address-chain)
 */
export const getTokenIds = () => protocols.map(p => `${p.address}-${p.chain}`);

export default protocols;

/**
 * Monitored Protocols Configuration.
 * Seeded with real, active pools on mainnet with high TVL.
 */

export const MONITORED_PROTOCOLS = [
  {
    id: 'curve-3pool-eth',
    name: 'Curve 3Pool',
    chain: 'eth',
    tokenId: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490-eth',  // 3CRV token
    pairId:  '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7-eth',  // Curve 3Pool pair
    dexScreenerPair: '0xdc24316b9ae028f1497c275eb9192a3ea0f67022',
    dexScreenerChain: 'ethereum',
    stablecoinTokenIds: ["0x6b175474e89094c44da98b954eedeac495271d0f-eth", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-eth"]
  },
  {
    id: 'uniswap-eth-usdc',
    name: 'Uniswap ETH/USDC',
    chain: 'eth',
    tokenId: '0xA0b86991c6218b36c1d19D4a2e9Eb0CE3606eB48-eth',  // USDC
    pairId:  '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640-eth',  // Uniswap V3 ETH/USDC 0.05%
    dexScreenerPair: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
    dexScreenerChain: 'ethereum',
    stablecoinTokenIds: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-eth"]
  },
  {
    id: 'pancake-bnb-usdt',
    name: 'PancakeSwap BNB/USDT',
    chain: 'bsc',
    tokenId: '0x55d398326f99059fF775485246999027B3197955-bsc',  // BSC USDT
    pairId:  '0x16b9a82891338f9bA80E2D6970FdDa79D1eb0daE-bsc',  // PCS BNB/USDT
    dexScreenerPair: '0x16b9a82891338f9bA80E2D6970FdDa79D1eb0daE',
    dexScreenerChain: 'bsc',
    stablecoinTokenIds: ["0x55d398326f99059ff775485246999027b3197955-bsc"]
  },
  {
    id: 'raydium-sol-usdc',
    name: 'Raydium SOL/USDC',
    chain: 'solana',
    tokenId: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v-solana',  // USDC on Solana
    pairId:  'HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ-solana',  // Raydium SOL/USDC
    dexScreenerPair: 'HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ',
    dexScreenerChain: 'solana',
    stablecoinTokenIds: ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v-solana"]
  },
  {
    id: 'orca-sol-usdt',
    name: 'Orca SOL/USDT',
    chain: 'solana',
    tokenId: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB-solana',  // USDT on Solana
    pairId:  'Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE-solana',  // Orca SOL/USDT
    dexScreenerPair: 'Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE',
    dexScreenerChain: 'solana',
    stablecoinTokenIds: ["Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB-solana"]
  },
];

export const getTokenIds = () => MONITORED_PROTOCOLS.map(p => p.tokenId);

export default MONITORED_PROTOCOLS;

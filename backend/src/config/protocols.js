/**
 * Monitored Protocols Configuration.
 */

export const MONITORED_PROTOCOLS = [
  {
    id: "curve-3pool-eth",
    name: "Curve 3Pool",
    chain: "eth",
    tokenId: "0x6b175474e89094c44da98b954eedeac495271d0f-eth", // DAI
    pairId: "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7-eth",
    stablecoinTokenIds: ["0x6b175474e89094c44da98b954eedeac495271d0f-eth", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-eth"]
  },
  {
    id: "pancakeswap-v3-bsc",
    name: "PancakeSwap V3",
    chain: "bsc",
    tokenId: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c-bsc", // WBNB
    pairId: "0x133ec93b9d0208d9173bc095c7a52660a92d83e2-bsc",
    stablecoinTokenIds: ["0x55d398326f99059ff775485246999027b3197955-bsc"] // USDT
  },
  {
    id: "aave-v3-eth",
    name: "Aave V3",
    chain: "eth",
    tokenId: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9-eth", // AAVE
    pairId: "0x309fcde75003c2faeb9f31ab2c10b1062f8b50e6-eth", 
    stablecoinTokenIds: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-eth"]
  },
  {
    id: "uniswap-v3-eth",
    name: "Uniswap V3",
    chain: "eth",
    tokenId: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984-eth", // UNI
    pairId: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8-eth",
    stablecoinTokenIds: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-eth"]
  },
  {
    id: "compound-v3-eth",
    name: "Compound V3",
    chain: "eth",
    tokenId: "0xc00e94Cb662C3520282E6f5717214004A7f26888-eth", // COMP
    pairId: "0xcf5bd7bd9799cd7f4f61f71a06708dd83dc7ab0a-eth",
    stablecoinTokenIds: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-eth"]
  }
];

export default MONITORED_PROTOCOLS;

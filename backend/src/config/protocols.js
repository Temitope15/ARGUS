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
  }
];

export default MONITORED_PROTOCOLS;

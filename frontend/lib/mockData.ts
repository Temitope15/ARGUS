import { AlertLevel } from './alertColors';

export interface ProtocolScore {
  protocolId: string;
  protocolName: string;
  chain: string;
  score: number;
  alertLevel: AlertLevel;
  signals: {
    tvlVelocityPts: number;
    lpDrainRatePts: number;
    stablecoinDepegPts: number;
    smartMoneyExitPts: number;
    aveRiskScorePts: number;
  };
  contagionMultiplierApplied: boolean;
  tvlUsd: number;
  priceChange1h: number;
  computedAt: number;
}

export interface SignalEvent {
  id: string;
  type: 'lp_removal' | 'smart_money_exit' | 'depeg_detected' | 'holder_exit';
  description: string;
  protocolId: string;
  amountUsd?: number;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export const INITIAL_MOCK_SCORES: ProtocolScore[] = [
  {
    protocolId: 'curve-3pool-eth',
    protocolName: 'Curve 3Pool',
    chain: 'eth',
    score: 67,
    alertLevel: 'ORANGE',
    signals: { 
      tvlVelocityPts: 15, 
      lpDrainRatePts: 25,
      stablecoinDepegPts: 0, 
      smartMoneyExitPts: 20,
      aveRiskScorePts: 7 
    },
    contagionMultiplierApplied: false,
    tvlUsd: 823_000_000,
    priceChange1h: -2.3,
    computedAt: Date.now(),
  },
  {
    protocolId: 'aave-v3-eth',
    protocolName: 'Aave V3',
    chain: 'eth',
    score: 23,
    alertLevel: 'YELLOW',
    signals: { 
      tvlVelocityPts: 8, 
      lpDrainRatePts: 10,
      stablecoinDepegPts: 5, 
      smartMoneyExitPts: 0,
      aveRiskScorePts: 0 
    },
    contagionMultiplierApplied: false,
    tvlUsd: 9_400_000_000,
    priceChange1h: -0.4,
    computedAt: Date.now(),
  },
  {
    protocolId: 'uniswap-v3-eth',
    protocolName: 'Uniswap V3',
    chain: 'eth',
    score: 8,
    alertLevel: 'GREEN',
    signals: { 
      tvlVelocityPts: 3, 
      lpDrainRatePts: 5,
      stablecoinDepegPts: 0, 
      smartMoneyExitPts: 0, 
      aveRiskScorePts: 0 
    },
    contagionMultiplierApplied: false,
    tvlUsd: 4_200_000_000,
    priceChange1h: 0.1,
    computedAt: Date.now(),
  },
  {
    protocolId: 'pancake-bsc',
    protocolName: 'PancakeSwap',
    chain: 'bsc',
    score: 41,
    alertLevel: 'YELLOW',
    signals: { 
      tvlVelocityPts: 10, 
      lpDrainRatePts: 15,
      stablecoinDepegPts: 10, 
      smartMoneyExitPts: 6,
      aveRiskScorePts: 0 
    },
    contagionMultiplierApplied: false,
    tvlUsd: 1_800_000_000,
    priceChange1h: -1.1,
    computedAt: Date.now(),
  },
  {
    protocolId: 'compound-v3-eth',
    protocolName: 'Compound V3',
    chain: 'eth',
    score: 12,
    alertLevel: 'GREEN',
    signals: { 
      tvlVelocityPts: 5, 
      lpDrainRatePts: 4,
      stablecoinDepegPts: 3, 
      smartMoneyExitPts: 0, 
      aveRiskScorePts: 0 
    },
    contagionMultiplierApplied: false,
    tvlUsd: 2_100_000_000,
    priceChange1h: 0.05,
    computedAt: Date.now(),
  },
];

export const MOCK_EVENT_TEMPLATES = [
  { type: 'lp_removal', description: 'Smart wallet 0x7a3f...d92c removed LP from pool', severity: 'medium' },
  { type: 'lp_removal', description: 'Large LP withdrawal: $2.1M pulled from USDC/ETH pair', severity: 'high' },
  { type: 'smart_money_exit', description: 'Whale 0x4d92...b71a reduced position by 34% in 8 minutes', severity: 'high' },
  { type: 'depeg_detected', description: 'USDC deviation detected: $0.9971 (−0.29% from peg)', severity: 'medium' },
  { type: 'lp_removal', description: 'TVL velocity alert: −7.3% in last 60 minutes', severity: 'medium' },
  { type: 'holder_exit', description: 'Top-10 holder reduced balance ratio by 22%', severity: 'high' },
  { type: 'smart_money_exit', description: '3 smart wallets exited within the same 30-minute window', severity: 'high' },
  { type: 'lp_removal', description: 'LP drain rate: 4.7× above 1-hour baseline', severity: 'medium' },
  { type: 'smart_money_exit', description: 'Smart wallet 0x9c21...f04e swapped $1.2M to USDC', severity: 'high' },
];

/**
 * Phase 1 API Mocks for testing Phase 2 logic.
 */

export const mockTvlHistory = (dropPct = 0) => {
  const now = Date.now();
  const currentTvl = 1000000;
  const oldTvl = currentTvl / (1 + (dropPct / 100));
  
  return [
    { timestamp: now, tvl: currentTvl },
    { timestamp: now - (60 * 60 * 1000), tvl: oldTvl }
  ];
};

export const mockLiquidityDrain = (ratio = 1) => {
  const events = [];
  const now = Date.now();
  
  // Prior hour: 5 events
  for (let i = 0; i < 5; i++) {
    events.push({ 
      event_type: 'removeLiquidity', 
      timestamp: now - (90 * 60 * 1000),
      amountUsd: 1000 
    });
  }

  // Current hour: 5 * ratio events
  for (let i = 0; i < Math.round(5 * ratio); i++) {
    events.push({ 
      event_type: 'removeLiquidity', 
      timestamp: now - (30 * 60 * 1000),
      amountUsd: 1000 
    });
  }

  return { events };
};

export const mockPriceDeviation = (price = 1.0) => {
  return {
    symbol: 'USDC',
    currentPrice: price,
    baselinePrice: 1.0,
    deviationPercent: (price - 1.0) * 100
  };
};

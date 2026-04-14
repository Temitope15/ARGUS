'use client';

import React from 'react';

const ITEMS = [
  "● ETH Mainnet — LIVE",
  "● BSC — LIVE",  
  "Curve 3Pool monitored",
  "Aave V3 monitored",
  "Uniswap V3 monitored",
  "Compound V3 monitored",
  "PancakeSwap monitored",
  "50 Smart Wallets tracked",
  "Top 100 holders tracked",
  "Signals updated every 60s",
];

export const SocialProofBar = () => {
  return (
    <div className="relative w-full h-12 bg-elevated border-y border-border overflow-hidden flex items-center">
      <div className="flex whitespace-nowrap animate-[shimmer_20s_linear_infinite]">
        {/* Render twice for seamless loop */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center">
            {ITEMS.map((item, index) => (
              <React.Fragment key={index}>
                <span className="text-secondary text-[10px] font-mono font-bold px-8 tracking-widest uppercase">
                  {item}
                </span>
                <div className="w-px h-3 bg-border" />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

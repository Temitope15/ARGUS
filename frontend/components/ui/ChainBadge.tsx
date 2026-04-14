import React from 'react';

interface ChainBadgeProps {
  chain: string;
}

export const ChainBadge = ({ chain }: ChainBadgeProps) => {
  const isEth = chain.toLowerCase() === 'eth' || chain.toLowerCase() === 'ethereum';
  
  return (
    <div className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
      isEth 
        ? "bg-blue-950/30 text-blue-400 border-blue-900/50" 
        : "bg-yellow-950/30 text-yellow-500 border-yellow-900/50"
    }`}>
      {chain.toUpperCase()}
    </div>
  );
};

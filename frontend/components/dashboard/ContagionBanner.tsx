'use client';

import React from 'react';
import { ProtocolScore } from '@/lib/mockData';

interface ContagionBannerProps {
  scores: ProtocolScore[];
}

export const ContagionBanner = ({ scores }: ContagionBannerProps) => {
  const distressed = scores.filter(s => s.score >= 46);
  const activeMultiplier = scores.some(s => s.contagionMultiplierApplied);

  if (!activeMultiplier) return null;

  return (
    <div className="h-11 bg-red-950/60 border-b border-red-900/50 px-6 flex items-center justify-between shrink-0 animate-slide-left">
      <div className="flex items-center">
        <div className="relative flex h-2.5 w-2.5 mr-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </div>
        <span className="text-red-400 font-mono font-bold text-[11px] tracking-wider">
          ⚡ SYSTEMIC CONTAGION MULTIPLIER ACTIVE
        </span>
      </div>

      <div className="hidden md:block text-red-300/60 text-[10px] uppercase tracking-widest font-medium">
        Multiple protocols in simultaneous distress — systemic risk amplification engaged
      </div>

      <div className="flex gap-2">
        {distressed.map((p) => (
          <div key={p.protocolId} className="bg-red-900/40 text-red-400 border border-red-800/50 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
            {p.protocolName}
          </div>
        ))}
      </div>
    </div>
  );
};

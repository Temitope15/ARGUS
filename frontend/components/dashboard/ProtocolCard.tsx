'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ProtocolScore } from '@/lib/mockData';
import { ScoreGauge } from '@/components/dashboard/ScoreGauge';
import { AlertBadge } from '@/components/ui/AlertBadge';
import { ChainBadge } from '@/components/ui/ChainBadge';
import { ALERT_COLORS } from '@/lib/alertColors';

interface ProtocolCardProps {
  data: ProtocolScore;
}

export const ProtocolCard = ({ data }: ProtocolCardProps) => {
  const { 
    protocolName, chain, score, alertLevel,
    tvlUsd, priceChange1h, signals, contagionMultiplierApplied 
  } = data;

  const colors = ALERT_COLORS[alertLevel];

  const signalRows = [
    { label: "TVL Velocity", pts: signals.tvlVelocityPts, max: 25 },
    { label: "LP Drain Rate", pts: signals.lpDrainRatePts, max: 25 },
    { label: "Stablecoin", pts: signals.stablecoinDepegPts, max: 20 },
    { label: "Smart Money", pts: signals.smartMoneyExitPts, max: 20 },
    { label: "AVE Risk", pts: signals.aveRiskScorePts, max: 10 },
  ];

  return (
    <div className={`bg-surface rounded-xl border p-5 transition-all duration-700 ${
      alertLevel === 'RED' 
        ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.08)] ring-1 ring-red-500/20' 
        : `border-border hover:border-argus/20`
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-primary text-sm mb-1">{protocolName}</h3>
          <ChainBadge chain={chain} />
        </div>
        <AlertBadge level={alertLevel} />
      </div>

      {/* Score and TVL Row */}
      <div className="flex items-center gap-6 mb-6">
        <ScoreGauge score={score} alertLevel={alertLevel} size={100} />
        
        <div className="flex flex-col">
          <span className="text-muted text-[10px] font-mono tracking-widest uppercase mb-1">Total Value Locked</span>
          <div className="font-mono text-xl font-bold text-primary">
            ${(tvlUsd / 1_000_000).toFixed(1)}M
          </div>
          <div className={`flex items-center gap-1 mt-1 font-mono text-xs ${priceChange1h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {priceChange1h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {priceChange1h >= 0 ? '+' : ''}{priceChange1h}%
            <span className="text-muted ml-1">1h</span>
          </div>
        </div>
      </div>

      {/* Signal Breakdown */}
      <div className="space-y-3">
        <span className="text-muted text-[10px] font-mono tracking-widest uppercase block mb-3">Signal Breakdown</span>
        {signalRows.map((row, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-24 flex-shrink-0 text-secondary text-[10px] font-mono">{row.label}</span>
            <div className="flex-1 bg-elevated rounded-full h-1">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out`}
                style={{ 
                  width: `${(row.pts / row.max) * 100}%`,
                  backgroundColor: row.pts === 0 ? 'transparent' : 
                                  row.pts >= row.max * 0.7 ? '#EF4444' : 
                                  row.pts >= row.max * 0.4 ? '#F97316' : '#F59E0B'
                }}
              />
            </div>
            <span className="w-8 text-right font-mono text-[10px] text-muted">{row.pts}pts</span>
          </div>
        ))}
      </div>

      {/* Contagion Footer */}
      {contagionMultiplierApplied && (
        <div className="mt-5 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2 animate-pulse">
           <span className="text-red-400 font-mono text-[10px] font-bold block text-center uppercase tracking-wider">
            ⚡ Contagion multiplier active · ×1.5 boost
          </span>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 flex justify-end">
        <span className="text-muted text-[9px] font-mono uppercase tracking-widest">
          Updated {new Date(data.computedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

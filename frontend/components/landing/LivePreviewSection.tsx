'use client';

import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { AlertBadge } from '@/components/ui/AlertBadge';

// Simplified Protocol Preview Data
const PROTOCOLS = [
  { name: 'Curve 3Pool', baseScore: 65, level: 'ORANGE' as const, color: 'border-orange-500/50' },
  { name: 'Aave V3', baseScore: 24, level: 'YELLOW' as const, color: 'border-amber-500/50' },
  { name: 'Uniswap V3', baseScore: 12, level: 'GREEN' as const, color: 'border-emerald-500/50' },
];

export const LivePreviewSection = () => {
  const ref = useScrollReveal();
  const [scores, setScores] = useState(PROTOCOLS.map(p => p.baseScore));

  useEffect(() => {
    const interval = setInterval(() => {
      setScores(prev => prev.map(s => {
        const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
        return Math.min(100, Math.max(0, s + change));
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-32 bg-void overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 reveal-on-scroll">
          <span className="text-argus font-mono text-xs tracking-widest uppercase mb-4 block">LIVE SYSTEM</span>
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-4">The war room is open.</h2>
          <p className="text-secondary text-xl">Real scores. Real signals. Real time.</p>
        </div>

        {/* Dashboard Mockup */}
        <div className="max-w-5xl mx-auto reveal-on-scroll">
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
            {/* Mock Header */}
            <div className="h-10 bg-elevated border-b border-border px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-argus rounded-full flex items-center justify-center">
                  <Eye size={8} className="text-white" />
                </div>
                <span className="font-mono text-[10px] text-white font-bold tracking-tight">ARGUS PREVIEW</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-mono text-[10px] text-emerald-400 font-bold">LIVE</span>
              </div>
            </div>

            {/* Mock Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {PROTOCOLS.map((p, i) => (
                <div key={i} className={`bg-elevated rounded-xl p-5 border ${p.color} transition-all duration-700`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    <AlertBadge level={p.level} />
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="font-mono text-4xl font-bold text-white transition-all duration-700">
                      {Math.round(scores[i])}
                    </div>
                    <div className="w-1/2 h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                      <div 
                        className="h-full bg-current transition-all duration-1000" 
                        style={{ width: `${scores[i]}%`, color: p.level === 'ORANGE' ? '#F97316' : p.level === 'YELLOW' ? '#F59E0B' : '#10B981' }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mock Feed */}
            <div className="bg-void/50 border-t border-border p-4 space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-mono border-l-2 border-orange-500 pl-3 py-1">
                <span className="text-white">Smart wallet 0x7a3f...d92c removed $847K of LP</span>
                <span className="text-muted ml-auto">2m ago</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono border-l-2 border-amber-500 pl-3 py-1 opacity-60">
                <span className="text-white">USDC deviation detected: $0.9971 (−0.29%)</span>
                <span className="text-muted ml-auto">5m ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center reveal-on-scroll">
          <GlowButton href="/dashboard" size="lg">
            Open the full war room →
          </GlowButton>
          <p className="text-muted text-sm mt-6">Free to explore · No wallet connection required</p>
        </div>
      </div>
    </section>
  );
};

'use client';

import React from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { AlertBadge } from '@/components/ui/AlertBadge';

export const SolutionSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="solution" className="py-32 bg-surface overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Side: Copy */}
          <div className="reveal-on-scroll">
            <span className="text-argus font-mono text-xs tracking-widest uppercase mb-4 block">THE SOLUTION</span>
            <h2 className="text-white text-5xl font-bold leading-tight mb-6">
              One number. <br />
              Everything you need to know.
            </h2>
            <div className="space-y-6 text-secondary text-lg leading-relaxed mb-10">
              <p>
                ARGUS watches 5 critical signals across every major DeFi 
                protocol simultaneously. Every 60 seconds, it calculates 
                a single Risk Score from 0 to 100.
              </p>
              <p>
                Zero means your money is safe. <br />
                One hundred means get out now.
              </p>
              <p className="text-primary font-medium italic">
                No charts to interpret. No jargon to decode. <br />
                One number, and what to do about it.
              </p>
            </div>

            {/* Score Legend */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <div className="font-mono text-sm">
                  <span className="text-emerald-400 w-16 inline-block">0 – 20</span>
                  <span className="text-muted ml-4">Safe — relax, everything is fine</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                <div className="font-mono text-sm">
                  <span className="text-amber-400 w-16 inline-block">21 – 45</span>
                  <span className="text-muted ml-4">Watch closely — something&apos;s changing</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                <div className="font-mono text-sm">
                  <span className="text-orange-400 w-16 inline-block">46 – 70</span>
                  <span className="text-muted ml-4">Act soon — risk is building fast</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                <div className="font-mono text-sm">
                  <span className="text-red-400 w-16 inline-block">71 – 100</span>
                  <span className="text-muted ml-4">Exit now — ARGUS has seen this before</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Floating Visuals */}
          <div className="relative reveal-on-scroll" style={{ transitionDelay: '300ms' }}>
            {/* Glow backdrop */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-argus/20 blur-[100px] rounded-full" />
            
            {/* Card Stack */}
            <div className="relative h-[400px]">
              {/* Curve (Top) */}
              <div className="absolute top-0 right-0 z-30 w-72 p-5 bg-surface border border-orange-900/50 rounded-xl shadow-2xl animate-float">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-white font-bold text-sm">Curve 3Pool</h4>
                    <span className="text-[10px] text-muted font-mono uppercase tracking-widest">ETH Mainnet</span>
                  </div>
                  <AlertBadge level="ORANGE" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-orange-500/30 border-t-orange-500 flex items-center justify-center">
                    <span className="font-mono font-bold text-orange-400">67</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted font-mono uppercase tracking-widest">TVL Locked</div>
                    <div className="text-lg font-mono font-bold text-white">$823M</div>
                  </div>
                </div>
              </div>

              {/* Aave (Behind Left) */}
              <div className="absolute top-20 -left-4 z-20 w-72 p-5 bg-surface/80 border border-amber-900/30 rounded-xl shadow-xl -rotate-6 scale-95 opacity-60">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-bold text-sm">Aave V3</h4>
                  <AlertBadge level="YELLOW" />
                </div>
                <div className="h-1 bg-amber-500/20 w-full rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[23%]" />
                </div>
              </div>

              {/* Uniswap (Further Behind) */}
              <div className="absolute top-40 right-10 z-10 w-64 p-5 bg-surface/50 border border-emerald-900/10 rounded-xl shadow-lg -rotate-12 scale-90 opacity-30">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-bold text-sm">Uniswap V3</h4>
                  <AlertBadge level="GREEN" />
                </div>
              </div>
            </div>

            {/* Reflection Shadow */}
            <div className="w-48 h-4 bg-argus/10 blur-xl rounded-full mx-auto mt-8" />
          </div>
        </div>
      </div>
    </section>
  );
};

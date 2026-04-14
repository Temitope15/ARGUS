'use client';

import React, { useState, useEffect } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export const ContagionSection = () => {
  const ref = useScrollReveal();
  const [stage, setStage] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev % 3) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-32 bg-surface overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6">
        {/* Intro */}
        <div className="text-center max-w-4xl mx-auto mb-20 reveal-on-scroll">
          <span className="text-argus font-mono text-xs tracking-widest uppercase mb-4 block">THE CONTAGION MULTIPLIER</span>
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-6">
            When two protocols fail together, it&apos;s never a coincidence.
          </h2>
          <p className="text-secondary text-xl">
            Every major DeFi collapse spreads. One protocol fails, it stresses the others. 
            Dominoes fall. ARGUS is the only system that detects this correlation in real time.
          </p>
        </div>

        {/* Animated Visual */}
        <div className="max-w-4xl mx-auto reveal-on-scroll">
          <div className="relative glass-card rounded-3xl p-12 overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
            
            {/* Stage Indicator */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${
                  stage === s ? 'w-8 bg-argus' : 'w-4 bg-white/10'
                }`} />
              ))}
            </div>

            {/* Protocol Cards and Connection */}
            <div className="relative flex flex-col md:flex-row items-center gap-12 md:gap-32">
              
              {/* Protocol A */}
              <div className={`w-64 p-6 rounded-2xl border transition-all duration-700 bg-elevated ${
                stage === 1 ? 'border-emerald-900/40 text-emerald-400' :
                stage === 2 ? 'border-orange-800/60 text-orange-400' :
                'border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.2)] text-red-400'
              }`}>
                <h4 className="font-bold text-lg mb-2">Curve 3Pool</h4>
                <div className="font-mono text-2xl mb-1">
                  {stage === 1 ? '18' : stage === 2 ? '51' : '77'}/100
                </div>
                <div className="text-[10px] font-mono tracking-widest uppercase opacity-70">
                  {stage === 1 ? '● SAFE' : stage === 2 ? '● WARNING' : '● DANGER'}
                </div>
                {stage === 3 && (
                  <div className="mt-4 pt-4 border-t border-red-900/40 text-[10px] font-mono">
                    51 × 1.5 = 77
                  </div>
                )}
              </div>

              {/* Connection Line */}
              <div className="relative h-12 md:h-px w-px md:w-32">
                <div className={`absolute inset-0 transition-all duration-700 ${
                  stage === 1 ? 'bg-border' : stage === 2 ? 'bg-orange-500/50' : 'bg-red-500 animate-pulse'
                }`} />
                {stage === 3 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap z-20">
                    <div className="bg-red-950 border border-red-800 text-red-400 px-3 py-1 rounded-full text-[10px] font-mono font-bold animate-pulse">
                      ⚡ CONTAGION ACTIVE
                    </div>
                  </div>
                )}
              </div>

              {/* Protocol B */}
              <div className={`w-64 p-6 rounded-2xl border transition-all duration-700 bg-elevated ${
                stage === 1 ? 'border-emerald-900/40 text-emerald-400' :
                'border-orange-800/60 text-orange-400'
              }`}>
                <h4 className="font-bold text-lg mb-2">Aave V3</h4>
                <div className="font-mono text-2xl mb-1">
                  {stage === 1 ? '22' : '47'}/100
                </div>
                <div className="text-[10px] font-mono tracking-widest uppercase opacity-70">
                  {stage === 1 ? '● SAFE' : '● WARNING'}
                </div>
              </div>
            </div>

            {/* Stage Labels */}
            <div className="mt-20 text-center">
              <p className="text-secondary text-lg font-medium transition-all duration-500">
                {stage === 1 ? "System monitoring in normal state." :
                 stage === 2 ? "Multiple protocols under stress..." :
                 "Multiplier triggered: High Systemic Risk."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-16 text-center reveal-on-scroll">
          <p className="text-white text-xl font-semibold mb-2">
            Terra/LUNA. Euler Finance. Cream Finance.
          </p>
          <p className="text-secondary">
            All correlated. All contagious. All detectable. ARGUS would have fired the alarm.
          </p>
        </div>
      </div>
    </section>
  );
};

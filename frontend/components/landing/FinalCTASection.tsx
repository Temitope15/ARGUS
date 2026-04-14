'use client';

import React from 'react';
import { GlowButton } from '@/components/ui/GlowButton';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export const FinalCTASection = () => {
  const ref = useScrollReveal();

  return (
    <section className="py-40 bg-void relative overflow-hidden" ref={ref}>
      {/* Background Eye (Slow Rotation) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-20 pointer-events-none">
        <svg viewBox="0 0 480 480" className="w-full h-full animate-orbit-slow">
          <circle cx="240" cy="240" r="230" fill="none" stroke="#FF6B2B" strokeWidth="1" strokeDasharray="4 8" />
          <path d="M 160 240 Q 240 160 320 240" fill="none" stroke="#FF6B2B" strokeWidth="2" />
          <path d="M 160 240 Q 240 320 320 240" fill="none" stroke="#FF6B2B" strokeWidth="2" />
          <circle cx="240" cy="240" r="24" fill="rgba(255,107,43,0.2)" stroke="#FF6B2B" strokeWidth="2" />
        </svg>
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <div className="reveal-on-scroll">
          <h2 className="text-white text-5xl md:text-7xl font-bold leading-tight mb-8">
            Your DeFi portfolio has <br />
            <span className="gradient-text">100 eyes</span> watching it now.
          </h2>
          
          <p className="text-secondary text-xl md:text-2xl max-w-2xl mx-auto mb-16">
            ARGUS never sleeps. It never misses a signal. It has already started 
            monitoring the protocols you care about.
          </p>

          <div className="flex justify-center mb-24">
            <GlowButton href="/dashboard" size="lg" className="px-12 py-5 text-xl shadow-[0_0_60px_rgba(255,107,43,0.3)]">
              Enter the War Room →
            </GlowButton>
          </div>

          <div className="pt-12 border-t border-white/5 space-y-2">
            <p className="text-muted text-sm font-mono tracking-wider">
              Built for AVE Claw Hackathon 2026 · Hong Kong Web3 Festival
            </p>
            <p className="text-muted text-xs font-mono uppercase tracking-[0.3em]">
              Powered by AVE Cloud API
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

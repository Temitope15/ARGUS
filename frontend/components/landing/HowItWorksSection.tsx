'use client';

import React from 'react';
import { Eye, Zap, Shield, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export const HowItWorksSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="how-it-works" className="py-32 bg-void overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6">
        {/* Intro */}
        <div className="text-center mb-24 reveal-on-scroll">
          <span className="text-argus font-mono text-xs tracking-widest uppercase mb-4 block">HOW IT WORKS</span>
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-4">From signal to safety in seconds.</h2>
          <p className="text-secondary text-xl max-w-2xl mx-auto">
            ARGUS handles everything. You just need to know what the score says.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          
          {/* Step 01 */}
          <div className="relative group reveal-on-scroll">
            <span className="absolute -top-12 -left-4 font-mono text-7xl text-white/[0.03] pointer-events-none select-none">01</span>
            <div className="glass-card rounded-2xl p-8 relative z-10 h-full hover:border-argus/30 transition-colors duration-500">
              <div className="w-12 h-12 rounded-xl bg-argus/10 flex items-center justify-center mb-6 text-argus">
                <Eye size={24} />
              </div>
              <h3 className="text-white text-xl font-bold mb-4">ARGUS watches. Constantly.</h3>
              <p className="text-secondary text-sm leading-relaxed mb-8">
                Every 60 seconds, ARGUS reads real-time data from every 
                major DeFi protocol. Liquidity levels. Wallet movements. 
                Stablecoin prices. Contract risk scores. You don&apos;t have 
                to do anything. It never stops.
              </p>
              {/* Mini visual */}
              <div className="grid grid-cols-3 gap-2 opacity-50">
                {['Compound', 'Curve', 'Aave', 'Uniswap', 'Pancake', 'Lido'].map((name, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                    <div className={`w-1 h-1 rounded-full animate-pulse ${i % 3 === 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-[8px] font-mono text-muted">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Arrow (Desktop) */}
            <div className="hidden lg:flex absolute top-1/2 -right-4 translate-x-1/2 -translate-y-1/2 z-20 text-argus/40">
              <ArrowRight size={24} />
            </div>
          </div>

          {/* Step 02 */}
          <div className="relative group reveal-on-scroll" style={{ transitionDelay: '150ms' }}>
            <span className="absolute -top-12 -left-4 font-mono text-7xl text-white/[0.03] pointer-events-none select-none">02</span>
            <div className="glass-card rounded-2xl p-8 relative z-10 h-full hover:border-argus/30 transition-colors duration-500">
              <div className="w-12 h-12 rounded-xl bg-argus/10 flex items-center justify-center mb-6 text-argus">
                <Zap size={24} />
              </div>
              <h3 className="text-white text-xl font-bold mb-4">You find out first.</h3>
              <p className="text-secondary text-sm leading-relaxed mb-8">
                When something shifts — even by a fraction — the Risk Score 
                updates instantly. Your Telegram shows you the number, 
                what changed, and by how much. No news article. No tweet. 
                You, first.
              </p>
              {/* Telegram Mock */}
              <div className="bg-[#17212b] rounded-xl p-3 font-sans text-xs shadow-lg border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-argus flex items-center justify-center text-[10px] text-white font-bold">A</div>
                  <span className="text-blue-400 font-bold">Argus Shield Bot</span>
                </div>
                <div className="bg-[#242f3d] rounded-lg p-2.5 text-white leading-normal">
                  <p className="font-bold mb-1">🟠 ORANGE ALERT — Curve 3Pool</p>
                  <p className="text-[10px] opacity-80 mb-2">Score: 58/100</p>
                  <p className="text-[10px]">↓ TVL dropped 12% in 1h</p>
                  <p className="text-[10px]">↓ 7x LP removal spike</p>
                </div>
              </div>
            </div>
            {/* Arrow (Desktop) */}
            <div className="hidden lg:flex absolute top-1/2 -right-4 translate-x-1/2 -translate-y-1/2 z-20 text-argus/40">
              <ArrowRight size={24} />
            </div>
          </div>

          {/* Step 03 */}
          <div className="relative group reveal-on-scroll" style={{ transitionDelay: '300ms' }}>
            <span className="absolute -top-12 -left-4 font-mono text-7xl text-white/[0.03] pointer-events-none select-none">03</span>
            <div className="glass-card rounded-2xl p-8 relative z-10 h-full hover:border-argus/30 transition-colors duration-500">
              <div className="w-12 h-12 rounded-xl bg-argus/10 flex items-center justify-center mb-6 text-argus">
                <Shield size={24} />
              </div>
              <h3 className="text-white text-xl font-bold mb-4">Automatic Protection.</h3>
              <p className="text-secondary text-sm leading-relaxed mb-8">
                Set your protection level once. When the score crosses 
                your threshold, ARGUS executes your preferred action — 
                withdraw LP, hedge position, or full exit to stablecoins. 
                It happens while you&apos;re sleeping.
              </p>
              {/* Option Pills */}
              <div className="flex flex-wrap gap-2">
                {['Withdraw LP', 'Hedge Position', 'Exit to USDC'].map((action, i) => (
                  <div key={i} className={`px-3 py-1.5 rounded-full border text-[10px] font-mono transition-colors ${
                    i === 0 ? 'bg-argus/10 border-argus text-argus' : 'bg-transparent border-border text-secondary'
                  }`}>
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

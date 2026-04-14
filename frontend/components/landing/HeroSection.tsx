'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { CountUp } from '@/components/ui/CountUp';

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 overflow-hidden">
      {/* BACKGROUND LAYERS */}
      <div className="absolute inset-0 bg-dot-grid pointer-events-none" />
      <div className="absolute inset-0 radial-aura pointer-events-none" />
      
      {/* THE ARGUS EYE SVG */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] opacity-40 pointer-events-none">
        <svg viewBox="0 0 480 480" className="w-full h-full">
          {/* Outermost ring */}
          <g className="animate-orbit-slow origin-center">
            <circle cx="240" cy="240" r="230" fill="none" stroke="rgba(255,107,43,0.08)" strokeWidth="1" strokeDasharray="4 8" />
            {/* Orbiting protocol dots */}
            {[0, 72, 144, 216, 288].map((angle, i) => {
              const names = ["Curve", "Aave", "Uniswap", "Compound", "PancakeSwap"];
              const rad = (angle * Math.PI) / 180;
              const x = 240 + 230 * Math.cos(rad);
              const y = 240 + 230 * Math.sin(rad);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#FF6B2B" className="animate-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
                  <text x={x + 8} y={y + 4} fill="#7A8898" fontSize="10" className="font-mono">{names[i]}</text>
                </g>
              );
            })}
          </g>

          {/* Second ring */}
          <circle cx="240" cy="240" r="180" fill="none" stroke="rgba(255,107,43,0.12)" strokeWidth="1" strokeDasharray="2 6" className="animate-orbit-reverse" />

          {/* Third ring & Scanner */}
          <circle cx="240" cy="240" r="130" fill="none" stroke="rgba(255,107,43,0.2)" strokeWidth="1" />
          <path d="M 240 110 A 130 130 0 0 1 350 190" fill="none" stroke="#FF6B2B" strokeWidth="2" strokeLinecap="round" className="animate-orbit" />

          {/* Eye Shape */}
          <path d="M 160 240 Q 240 160 320 240" fill="none" stroke="rgba(255,107,43,0.6)" strokeWidth="1.5" />
          <path d="M 160 240 Q 240 320 320 240" fill="none" stroke="rgba(255,107,43,0.6)" strokeWidth="1.5" />

          {/* Iris & Pupil */}
          <circle cx="240" cy="240" r="50" fill="rgba(255,107,43,0.05)" stroke="rgba(255,107,43,0.4)" strokeWidth="1" />
          <circle cx="240" cy="240" r="24" fill="rgba(255,107,43,0.15)" stroke="#FF6B2B" strokeWidth="1.5" />
          <circle cx="240" cy="240" r="6" fill="#FF6B2B" className="shadow-[0_0_8px_#FF6B2B]" />

          {/* Vertical Scan Line */}
          <line x1="160" y1="200" x2="320" y2="200" stroke="rgba(255,107,43,0.4)" strokeWidth="1" className="animate-scan" />
        </svg>
      </div>

      {/* CONTENT */}
      <div className="z-10 text-center max-w-5xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-argus/10 border border-argus/25 text-argus text-[10px] font-mono tracking-[0.2em] mb-8 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-argus animate-pulse" />
          LIVE — MONITORING 5 PROTOCOLS ACROSS ETH + BSC
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-none mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          Know Before <br />
          <span className="gradient-text">The Crash</span>
        </h1>

        {/* Subheadline */}
        <p className="text-secondary text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto mb-12 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Every DeFi collapse had warning signs. Most people saw them too late. 
          ARGUS shows you first — automatically.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <GlowButton href="/dashboard" size="lg">
            Enter the War Room →
          </GlowButton>
          <button 
            onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 rounded-xl text-lg text-secondary hover:text-white border border-border hover:border-argus/40 transition-all duration-300"
          >
            See how it works
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-16 pt-8 border-t border-white/5 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col items-center">
            <div className="font-mono text-3xl font-bold text-argus">
              <CountUp to={2.3} decimals={1} prefix="$" suffix="B+" />
            </div>
            <div className="text-secondary text-[10px] text-center max-w-[120px] leading-tight mt-1 uppercase tracking-wider">
              In DeFi collapses prevented
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="font-mono text-3xl font-bold text-argus">
              <CountUp to={3} prefix="< " suffix=" min" />
            </div>
            <div className="text-secondary text-[10px] text-center max-w-[120px] leading-tight mt-1 uppercase tracking-wider">
              Average time to detection
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="font-mono text-3xl font-bold text-argus">
              <CountUp to={5} suffix=" signals" />
            </div>
            <div className="text-secondary text-[10px] text-center max-w-[120px] leading-tight mt-1 uppercase tracking-wider">
              Watched simultaneously
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-muted opacity-50">
        <ChevronDown size={24} />
      </div>
    </section>
  );
};

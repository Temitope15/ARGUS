'use client';

import React from 'react';
import { Eye, TrendingDown, AlertTriangle, Zap, X } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const STAGES = [
  {
    time: "T−2h",
    color: "text-emerald-400",
    borderColor: "border-emerald-800",
    bgColor: "bg-emerald-950/50",
    icon: Eye,
    title: "Liquidity quietly drains",
    body: "A few large wallets start removing LP. Volume is small. Nobody notices."
  },
  {
    time: "T−90m",
    color: "text-amber-400",
    borderColor: "border-amber-800",
    bgColor: "bg-amber-950/50",
    icon: TrendingDown,
    title: "Smart wallets begin exiting",
    body: "The most profitable on-chain traders reduce positions. Silently. No announcements."
  },
  {
    time: "T−60m",
    color: "text-orange-400",
    borderColor: "border-orange-800",
    bgColor: "bg-orange-950/50",
    icon: AlertTriangle,
    title: "Stablecoin slips $0.003",
    body: "An almost invisible deviation from $1.00. Most dashboards don't even show it."
  },
  {
    time: "T−20m",
    color: "text-red-400",
    borderColor: "border-red-800",
    bgColor: "bg-red-950/50",
    icon: Zap,
    title: "Cascade begins",
    body: "The first liquidations trigger. More LPs exit. It's accelerating. Still no news."
  },
  {
    time: "T=0",
    color: "text-red-300",
    borderColor: "border-red-600",
    bgColor: "bg-red-950/50",
    icon: X,
    title: "Collapse. Public now.",
    body: "Twitter breaks the news. The money is already gone."
  }
];

export const ProblemSection = () => {
  const ref = useScrollReveal();

  return (
    <section id="problem" className="py-32 bg-void overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6">
        {/* Intro */}
        <div className="text-center mb-24 reveal-on-scroll">
          <span className="text-argus font-mono text-xs tracking-widest uppercase mb-4 block">THE PROBLEM</span>
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-4">The warning signs were always there.</h2>
          <p className="text-secondary text-xl max-w-2xl mx-auto">Nobody had a system to read them.</p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-[22px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent hidden md:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 relative z-10">
            {STAGES.map((stage, i) => (
              <div key={i} className="flex flex-col items-center text-center reveal-on-scroll" style={{ transitionDelay: `${i * 150}ms` }}>
                {/* Circle Icon */}
                <div className={`w-12 h-12 rounded-full border ${stage.borderColor} ${stage.bgColor} flex items-center justify-center mb-6 shadow-xl`}>
                  <stage.icon size={20} className={stage.color} />
                </div>
                
                {/* Label */}
                <span className={`font-mono text-xs mb-3 ${stage.color} font-bold`}>{stage.time}</span>
                
                {/* Text Content */}
                <h3 className="text-white font-semibold text-sm mb-3 px-4">{stage.title}</h3>
                <p className="text-muted text-xs leading-relaxed max-w-[200px]">
                  {stage.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Callout */}
        <div className="mt-32 max-w-3xl mx-auto reveal-on-scroll">
          <div className="bg-argus/5 border border-argus/20 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-argus/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <h3 className="text-white text-2xl md:text-3xl font-semibold mb-4 relative z-10">
              At every one of these stages, ARGUS was already watching.
            </h3>
            <p className="text-secondary text-lg relative z-10">
              The signals are always there. Terra. Euler. Cream Finance. Every time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

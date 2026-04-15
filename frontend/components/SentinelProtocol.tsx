'use client';

import { motion } from 'framer-motion';

export default function SentinelProtocol() {
  const steps = [
    {
      id: '01',
      title: 'Exposure Mapping',
      desc: 'Our engine identifies your liquidity positions across high-risk protocols and cross-chain bridges.',
      icon: '🔍',
    },
    {
      id: '02',
      title: 'Sentinel Guardian',
      desc: '24/7 autonomous monitoring of pool depth, contract health, and large-scale volatility.',
      icon: '⚔️',
    },
    {
      id: '03',
      title: 'Direct Evasion',
      desc: 'Instant Telegram alerts trigger before liquidity drains, allowing you to move capital in seconds.',
      icon: '⚡',
    },
  ];

  return (
    <section className="py-32 px-6 max-w-7xl mx-auto border-t border-white/5 bg-base">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="text-cyan text-xs font-black tracking-widest uppercase mb-4 italic">The Architecture</div>
        <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tighter">The Sentinel <span className="text-cyan">Protocol.</span></h2>
        <p className="text-secondary text-lg font-medium leading-relaxed">
          While traditional monitoring tools alert you to what <span className="text-white italic">happened</span>, 
          ARGUS tells you what is <span className="text-white italic">happening</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <motion.div 
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            className="glass-premium p-10 rounded-2xl border-white/5 hover:border-cyan/30 transition-colors relative group"
          >
            <div className="text-6xl font-black text-cyan/10 absolute -top-4 -right-4 italic group-hover:text-cyan/20 transition-colors">
              {step.id}
            </div>
            
            <div className="w-16 h-16 rounded-2xl bg-cyan/5 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
              {step.icon}
            </div>

            <h3 className="text-2xl font-black mb-4 tracking-tighter uppercase italic">{step.title}</h3>
            <p className="text-secondary leading-relaxed font-medium">
              {step.desc}
            </p>

            <div className="mt-8 flex items-center gap-2 text-cyan font-black text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity uppercase">
              Learn More <span className="translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

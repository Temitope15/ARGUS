'use client';

import { motion } from 'framer-motion';

export default function ImpactSection() {
  const stats = [
    { label: 'Protocols Monitored', value: '124+', sub: 'High-TVL Platforms' },
    { label: 'Intelligence Accuracy', value: '99.9%', sub: 'Low False Positives' },
    { label: 'Alert Response', value: '<420ms', sub: 'Instant Propagation' },
  ];

  const protocols = [
    { name: 'Uniswap V3', health: 98, tvl: '$1.2B', chain: 'ETH' },
    { name: 'Curve Finance', health: 84, tvl: '$840M', chain: 'MULTICHAIN' },
    { name: 'Aave V3', health: 99, tvl: '$2.1B', chain: 'ETH' },
    { name: 'PancakeSwap', health: 92, tvl: '$450M', chain: 'BSC' },
    { name: 'Lido Finance', health: 65, tvl: '$14B', chain: 'ETH', risk: 'High' },
    { name: 'MakerDAO', health: 97, tvl: '$5.4B', chain: 'ETH' },
  ];

  return (
    <section className="py-32 px-6 max-w-7xl mx-auto border-t border-white/5 relative bg-base">
      <div className="flex flex-col lg:flex-row gap-20">
        
        {/* Left: Global Stats */}
        <div className="lg:w-1/3 space-y-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase italic tracking-tighter">
              Institutional<br/>
              <span className="text-cyan">Vigilance.</span>
            </h2>
            <p className="text-secondary text-lg leading-relaxed font-medium">
              ARGUS monitors the heartbeat of DeFi. We track liquidity, contract calls, 
              and whale movements across 12,000+ pools to detect contagion before it spreads.
            </p>
          </div>

          <div className="space-y-8">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="text-xs font-black text-muted tracking-widest uppercase mb-1">{stat.label}</div>
                <div className="text-4xl font-black text-white group-hover:text-cyan transition-colors">{stat.value}</div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Protocol Grid (MEXC Style) */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black tracking-widest uppercase text-muted italic">Live Sentinel Feed</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse"></span> SCANNING</span>
              <span className="text-muted">|</span>
              <button className="text-muted hover:text-white transition-colors">VIEW ALL PROTOCOLS →</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {protocols.map((p, i) => (
              <motion.div 
                key={p.name}
                whileHover={{ y: -5, borderColor: 'var(--cyan)' }}
                className="glass-premium p-6 border-white/5 rounded-2xl relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center font-black text-xs text-white">
                    {p.name[0]}
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-black tracking-widest ${p.health > 80 ? 'bg-cyan/10 text-cyan' : 'bg-red/10 text-red'}`}>
                    {p.health}% HEALTH
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-black tracking-tight">{p.name}</h4>
                  <p className="text-[10px] text-muted font-bold tracking-widest uppercase">{p.chain} MONITORING</p>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] text-muted font-bold uppercase tracking-widest">Active TVL</div>
                    <div className="text-lg font-black text-white">{p.tvl}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-black ${p.health > 80 ? 'text-cyan' : 'text-red'}`}>
                      {p.risk === 'High' ? '⚠️ RISK DETECTED' : '✓ SECURE'}
                    </div>
                  </div>
                </div>

                {/* Micro Chart Sparkline Placeholder */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyan to-transparent opacity-30"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

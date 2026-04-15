'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [stats, setStats] = useState({
    protocols_monitored: 0,
    alerts_fired_today: 0,
    whale_moves_detected: 0,
    active_subscribers: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://argus-backend-tkgz.onrender.com'}/api/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-base text-primary overflow-x-hidden selection:bg-accent/30">
      {/* Dynamic Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/50 to-base"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-base/40 backdrop-blur-xl sticky top-0 z-50 glass"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center font-black text-black text-2xl mb-1 italic shadow-lg shadow-accent/20"
          >
            A
          </motion.div>
          <span className="text-2xl font-black tracking-tighter uppercase italic">Argus</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-white transition-all">
            Investor Login
          </Link>
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-white transition-all">
            Intelligence
          </Link>
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://t.me/Argus_shield_bot" 
            target="_blank" 
            className="btn-primary py-2 px-6 text-[10px] uppercase tracking-[0.2em]"
          >
            Connect Bot
          </motion.a>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 max-w-5xl mx-auto z-10">
        <div className="scanner-line"></div>
        
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
        >
          <span className="badge bg-accent/10 text-accent border-accent/20 mb-8 inline-block animate-pulse">
            System Status: Active Monitoring
          </span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8 text-white uppercase italic glow-text">
            DeFi moves fast.<br />
            <span className="text-accent underline decoration-8 underline-offset-[12px]">Collapses faster.</span>
          </h1>
          <p className="text-xl md:text-2xl text-secondary mb-12 max-w-3xl font-medium leading-relaxed">
            ARGUS is the autonomous sentinel for the DeFi dark forest. We monitor every pool, 
            every whale, and every depeg — alerting you <span className="text-white italic">before</span> the collapse.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <motion.a 
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 122, 47, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              href="https://t.me/Argus_shield_bot" 
              target="_blank" 
              className="btn-primary text-xl px-12 py-6 rounded-2xl"
            >
              Start Monitoring Free →
            </motion.a>
            <Link href="/dashboard" className="text-muted hover:text-white font-bold uppercase tracking-widest text-sm transition-all">
              Explore Live Alerts Map
            </Link>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-12 text-[10px] text-muted font-bold tracking-[0.3em] uppercase"
          >
            No account needed • No signup • Direct Telegram Access
          </motion.div>
        </motion.div>
      </section>

      {/* Live Stats Ticker */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="border-y border-white/5 bg-surface/30 backdrop-blur-md py-6 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-8 font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-secondary">
          <StatItem label="Protocols monitored" value={stats.protocols_monitored} color="accent" />
          <StatItem label="Alerts fired today" value={stats.alerts_fired_today} color="red" />
          <StatItem label="Whale moves detected" value={stats.whale_moves_detected} color="orange" />
          <StatItem label="Active subscribers" value={stats.active_subscribers} color="green" />
        </div>
      </motion.section>

      {/* Feature Section */}
      <section className="max-w-7xl mx-auto px-6 py-40 grid md:grid-cols-3 gap-8 relative z-10">
        <FeatureCard 
          emoji="👁️" 
          title="Autonomous Surveillance" 
          desc="Continuous monitoring of high-TVL pools, identifying liquidity drains and whale exits before they trigger panic."
        />
        <FeatureCard 
          emoji="⚡" 
          title="Instant Broadcast" 
          desc="Risk escalations are pushed immediately via Telegram. Move your assets while everyone else is still reading the news."
        />
        <FeatureCard 
          emoji="🛡️" 
          title="Contagion Intelligence" 
          desc="Unified scoring from 0-100 across 5 weighted risk vectors. Simple, actionable intelligence for a complex market."
        />
      </section>

      {/* Social Proof / Call to Action */}
      <section className="py-40 px-6 flex flex-col items-center text-center relative z-10 overflow-hidden">
        <motion.div 
          whileInView={{ scale: [0.9, 1], opacity: [0, 1] }}
          className="card p-16 md:p-24 max-w-5xl w-full border-accent/20 bg-accent/5 relative glass overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-30"></div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 italic uppercase tracking-tighter leading-none glow-text">
            The Smoke Detector<br/>for your DeFi Capital.
          </h2>
          <p className="text-xl text-secondary mb-12 font-medium">It's free. It's instant. It's institutional-grade intelligence.</p>
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://t.me/Argus_shield_bot" 
            target="_blank" 
            className="btn-primary text-xl px-16 py-6 inline-flex"
          >
            Deploy ARGUS Sentinel →
          </motion.a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 text-center text-muted font-mono text-[10px] uppercase tracking-[0.4em] z-10 bg-base">
        &copy; 2024 ARGUS Intelligence Systems // On-chain Protection Layer // All Rites Reserved
      </footer>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string, value: number, color: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    
    let timer = setInterval(() => {
      start += Math.ceil((end - start) / 10);
      setDisplayValue(start);
      if (start >= end) clearInterval(timer);
    }, 50);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="flex items-center gap-3">
      <span className={`w-2 h-2 rounded-full bg-${color}`}></span>
      <span>{label}: <span className="text-white font-black">{displayValue.toLocaleString()}</span></span>
    </div>
  );
}

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10, borderColor: 'var(--accent)' }}
      className="card p-10 glass border-white/5 relative group h-full"
    >
      <div className="text-5xl mb-8 group-hover:scale-110 transition-transform">{emoji}</div>
      <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tighter glow-text">{title}</h3>
      <p className="text-secondary leading-relaxed font-medium">
        {desc}
      </p>
    </motion.div>
  );
}

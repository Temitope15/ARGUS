'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import ImpactSection from '@/components/ImpactSection';
import SentinelProtocol from '@/components/SentinelProtocol';
import BotShowcase from '@/components/BotShowcase';

export default function LandingPage() {
  const [stats, setStats] = useState({
    protocols_monitored: 124,
    alerts_fired_today: 18,
    whale_moves_detected: 42,
    active_subscribers: 1540
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
    <div className="flex flex-col min-h-screen bg-base text-primary overflow-x-hidden selection:bg-cyan/30">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="mesh-background"></div>
        <div className="grid-perspective opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/50 to-base"></div>
      </div>

      {/* Floating Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-7xl">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-premium rounded-2xl px-8 py-4 flex items-center justify-between border-white/5"
        >
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan to-blue flex items-center justify-center font-black group-hover:rotate-12 transition-transform shadow-lg shadow-cyan/20">
              A
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              ARGUS
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-secondary">
            <Link href="#impact" className="hover:text-white transition-colors">Impact</Link>
            <Link href="#protocol" className="hover:text-white transition-colors">How it Works</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://t.me/Argus_shield_bot" 
              target="_blank" 
              className="btn-primary py-2 px-6 text-xs text-white uppercase tracking-widest"
            >
              Connect Bot
            </motion.a>
          </div>
        </motion.div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative px-6 pt-44 pb-32 max-w-7xl mx-auto overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left: Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex-1 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-premium border-cyan/20 text-cyan text-xs font-black tracking-widest uppercase mb-8 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_10px_var(--cyan)]"></span>
                System Status: Active Monitoring
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black leading-[0.9] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
                DEFI MOVES FAST.<br />
                <span className="text-cyan glow-text">COLLAPSES FASTER.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-secondary mb-10 max-w-2xl font-medium leading-relaxed">
                ARGUS is the autonomous sentinel for the DeFi dark forest. We monitor every pool, 
                every whale, and every depeg — alerting you <span className="text-white">before</span> the collapse.
              </p>

              {/* MEXC-style Search Bar */}
              <div className="relative max-w-lg mx-auto lg:mx-0 mb-12 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan/50 to-blue/50 rounded-2xl blur opacity-25 group-focus-within:opacity-75 transition duration-500"></div>
                <div className="relative flex items-center glass-premium rounded-2xl p-1 border-white/10 group-focus-within:border-cyan/50 transition-colors">
                  <div className="pl-6 pr-4 py-4 text-cyan">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Scan Pool Address or Token Symbol..." 
                    className="bg-transparent border-none outline-none flex-1 py-4 text-white placeholder:text-muted font-medium text-lg w-full"
                  />
                  <button className="bg-cyan hover:bg-cyan-bright transition-colors text-white font-bold py-3 px-8 rounded-xl mr-1 hidden sm:block">
                    SCAN
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                <motion.a 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://t.me/Argus_shield_bot" 
                  target="_blank" 
                  className="btn-primary text-lg px-10 py-5 text-white"
                >
                  Start Monitoring Free →
                </motion.a>
                <Link href="/dashboard" className="text-secondary hover:text-white font-bold uppercase tracking-widest text-xs transition-colors py-4">
                  Explore Live Intelligence Map
                </Link>
              </div>
            </motion.div>

            {/* Right: Immersive Visuals */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex-1 relative w-full aspect-square max-w-[500px]"
            >
              {/* Beam of Light */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] hero-beam pointer-events-none"></div>
              
              {/* Floating Icons Container */}
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div 
                  animate={{ 
                    y: [0, -30, 0],
                    rotateY: [0, 10, 0]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-20"
                >
                  <Image 
                    src="/eth_icon.png" 
                    alt="Ethereum" 
                    width={320} 
                    height={320} 
                  />
                </motion.div>
                
                {/* Orbital Icons */}
                <motion.div 
                  animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 right-10 z-10"
                >
                  <Image src="/usdt_icon.png" alt="Tether" width={140} height={140} className="opacity-80" />
                </motion.div>
                
                <motion.div 
                  animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-10 left-10 z-30"
                >
                  <Image src="/sol_icon.png" alt="Solana" width={160} height={160} className="rotate-[-15deg] opacity-90" />
                </motion.div>
                
                {/* Data Points / Particles */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.2, 0.5],
                        x: Math.random() * 400 - 200,
                        y: Math.random() * 400 - 200
                      }}
                      transition={{ 
                        duration: 3 + Math.random() * 2, 
                        repeat: Infinity, 
                        delay: Math.random() * 5 
                      }}
                      className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hero Bottom Feature Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden glass-premium border-white/5"
          >
            <HeroFeature 
              icon="🔄" 
              title="Asset Intelligence" 
              desc="Real-time flow analysis for whales and institutional movers." 
            />
            <HeroFeature 
              icon="🛡️" 
              title="Autonomous Shields" 
              desc="Instant de-risk alerts via Telegram before liquidity drains." 
            />
            <HeroFeature 
              icon="📊" 
              title="Risk Contagion" 
              desc="Unified health scoring across DeFi protocols and chains." 
            />
          </motion.div>
        </section>

        {/* Live Market Bar (MEXC Style) */}
        <section className="bg-bg-surface/50 border-y border-white/5 py-8 overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-marquee gap-16">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-16 items-center">
                <MarketStat label="PROTOCOLS" value={stats.protocols_monitored.toLocaleString()} color="cyan" />
                <MarketStat label="ALERTS FIRED" value={stats.alerts_fired_today.toLocaleString()} color="cyan" />
                <MarketStat label="WHALE MOVES" value={stats.whale_moves_detected.toLocaleString()} color="cyan" />
                <MarketStat label="ACTIVE SHIELDS" value={stats.active_subscribers.toLocaleString()} color="cyan" />
                <MarketStat label="TVL MONITORED" value="$2.4B+" color="cyan" />
                <MarketStat label="AVG RESPONSE" value="420ms" color="cyan" />
              </div>
            ))}
          </div>
          <style jsx>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 30s linear infinite;
              width: max-content;
            }
          `}</style>
        </section>

        {/* Phase 2 Sections */}
        <section id="impact"><ImpactSection /></section>
        <section id="protocol"><SentinelProtocol /></section>
        <BotShowcase />

        {/* Final CTA Section */}
        <section className="py-40 px-6 max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="glass-premium p-16 md:p-24 rounded-[3rem] border-cyan/20 bg-cyan/5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan to-transparent"></div>
            <h2 className="text-4xl md:text-7xl font-black mb-6 uppercase italic tracking-tighter glow-text">
              Deploy Your<br/><span className="text-cyan">Shield Today.</span>
            </h2>
            <p className="text-xl text-secondary mb-12 font-medium max-w-2xl mx-auto">
              Join 1,500+ institutional and retail investors protecting their capital in the DeFi dark forest.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.a 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                href="https://t.me/Argus_shield_bot" 
                target="_blank" 
                className="btn-primary text-xl px-16 py-6 text-white"
              >
                CONNECT TELEGRAM →
              </motion.a>
            </div>
            <div className="mt-12 text-[10px] text-muted font-bold tracking-[0.3em] uppercase">
              Free Implementation • Institutional Security • 24/7 Monitoring
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="py-12 px-6 text-center text-muted font-mono text-[10px] uppercase tracking-[0.4em] z-10 bg-base border-t border-white/5">
        &copy; 2024 ARGUS Intelligence Systems // On-chain Protection Layer
      </footer>
    </div>
  );
}

function HeroFeature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-10 hover:bg-cyan/5 transition-colors group">
      <div className="text-3xl mb-4 group-hover:scale-110 transition-transform flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-black tracking-tight">{title}</h3>
      </div>
      <p className="text-secondary text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function MarketStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-4 group cursor-default">
      <span className="text-muted font-black text-xs tracking-widest">{label}</span>
      <span className={`text-xl font-black text-white glow-text group-hover:text-cyan transition-colors`}>{value}</span>
    </div>
  );
}

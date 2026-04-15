'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <div className="flex flex-col min-h-screen bg-base text-primary overflow-x-hidden">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-base/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-black text-black text-xl italic">A</div>
          <span className="text-xl font-extrabold tracking-tighter uppercase">Argus</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-bold text-secondary hover:text-primary transition-colors">
            Dashboard
          </Link>
          <a href="https://t.me/Argus_shield_bot" target="_blank" className="btn-primary py-2 px-4 text-sm scale-90">
            Open Telegram
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6 text-white uppercase italic">
          DeFi moves fast.<br />
          <span className="text-accent underline decoration-4 underline-offset-8">Collapses move faster.</span>
        </h1>
        <p className="text-xl md:text-2xl text-secondary mb-10 max-w-2xl font-medium">
          ARGUS watches every pool, every whale, every signal — and tells you on Telegram before the news breaks.
        </p>
        <div className="flex flex-col items-center gap-4">
          <a href="https://t.me/Argus_shield_bot" target="_blank" className="btn-primary text-xl px-10 py-5">
            Start monitoring free →
          </a>
          <p className="text-sm text-muted font-bold tracking-wide">
            No account. No signup. Just /start on Telegram.
          </p>
        </div>
      </section>

      {/* Real Stats Bar */}
      <section className="border-y border-border bg-surface/50 backdrop-blur-sm py-4">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-between items-center gap-6 font-mono text-sm tracking-widest text-secondary overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="text-accent">●</span> Protocols monitored: <span className="text-primary">{stats.protocols_monitored}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red">●</span> Alerts fired today: <span className="text-primary">{stats.alerts_fired_today}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow">●</span> Whale moves detected: <span className="text-primary">{stats.whale_moves_detected}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green">●</span> Active subscribers: <span className="text-primary">{stats.active_subscribers}</span>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="max-w-6xl mx-auto px-6 py-32 grid md:grid-cols-3 gap-12">
        <div className="card p-8">
          <div className="text-4xl mb-6">👁️</div>
          <h3 className="text-2xl font-bold mb-4 uppercase italic tracking-tight">Always watching</h3>
          <p className="text-secondary leading-relaxed">
            ARGUS monitors liquidity pools 24/7 — tracking TVL changes, whale movements, and stablecoin stability across every major DeFi protocol in real time.
          </p>
        </div>
        <div className="card p-8">
          <div className="text-4xl mb-6">⚡</div>
          <h3 className="text-2xl font-bold mb-4 uppercase italic tracking-tight">Alerts before the crash</h3>
          <p className="text-secondary leading-relaxed">
            When a whale quietly removes $2M in liquidity, or a stablecoin starts losing its peg, ARGUS fires a Telegram alert — while everyone else is still asleep.
          </p>
        </div>
        <div className="card p-8">
          <div className="text-4xl mb-6">🛡️</div>
          <h3 className="text-2xl font-bold mb-4 uppercase italic tracking-tight">A score you can act on</h3>
          <p className="text-secondary leading-relaxed">
            Every protocol gets a Contagion Score from 0 to 100. Green means safe. Red means move your money. Simple.
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-surface/30 border-y border-border py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold mb-16 text-center italic tracking-tight uppercase">Mission Protocol</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-border-bright rounded-full flex items-center justify-center font-bold text-xl mb-6">1</div>
              <h4 className="text-xl font-bold mb-2">Open Telegram</h4>
              <p className="text-secondary">Send /start to @Argus_shield_bot</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-border-bright rounded-full flex items-center justify-center font-bold text-xl mb-6">2</div>
              <h4 className="text-xl font-bold mb-2">Protocol Sync</h4>
              <p className="text-secondary">ARGUS begins monitoring DeFi pools for you</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-border-bright rounded-full flex items-center justify-center font-bold text-xl mb-6">3</div>
              <h4 className="text-xl font-bold mb-2">Real-time Intel</h4>
              <p className="text-secondary">When something moves — you hear about it first</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 px-6 flex flex-col items-center text-center">
        <div className="card p-12 max-w-4xl w-full border-accent/20 bg-accent/5">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 italic uppercase tracking-tight">The smoke detector for your DeFi money.</h2>
          <p className="text-xl text-secondary mb-10">It's free. It's instant. It might save you thousands.</p>
          <a href="https://t.me/Argus_shield_bot" target="_blank" className="btn-primary text-xl px-12 py-5 max-w-md mx-auto">
            Open Telegram and start →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 text-center text-muted font-mono text-xs uppercase tracking-widest">
        &copy; 2024 ARGUS Intelligence Systems // On-chain Protection Layer
      </footer>
    </div>
  );
}

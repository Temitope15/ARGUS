'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex flex-col min-h-screen bg-base text-primary overflow-hidden relative selection:bg-accent/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 grid-background opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-red/5"></div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-base/40 backdrop-blur-xl relative z-10 glass">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-black text-black text-xl italic group-hover:rotate-12 transition-transform">A</div>
          <span className="text-xl font-black tracking-tighter uppercase italic">Argus</span>
        </Link>
      </nav>

      {/* Login Container */}
      <main className="flex-grow flex items-center justify-center px-6 py-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card w-full max-w-md p-10 glass border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2 glow-text">Investor Access</h1>
            <p className="text-muted text-xs font-bold uppercase tracking-widest">Sentinel Identification Required</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Operational Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sentinel@argus.systems"
                className="w-full bg-base/50 border border-white/5 rounded-xl px-4 py-4 text-sm font-mono focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Security Token / Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-base/50 border border-white/5 rounded-xl px-4 py-4 text-sm font-mono focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-5 rounded-2xl text-md uppercase tracking-widest shadow-lg shadow-accent/20"
            >
              Initialize Session
            </motion.button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-4">Or identify via</p>
            <motion.a 
              whileHover={{ y: -2 }}
              href="https://t.me/Argus_shield_bot" 
              target="_blank" 
              className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-secondary hover:text-white transition-all"
            >
              <span className="text-lg">🛡️</span> Telegram Sentinel
            </motion.a>
          </div>

          <div className="mt-10 text-[9px] text-muted text-center uppercase tracking-[0.3em] leading-loose">
            Access to this terminal is restricted.<br/>Unauthorized attempts will be logged by the Sentinel.
          </div>
        </motion.div>
      </main>

      <footer className="py-8 px-6 text-center text-[9px] text-muted font-mono uppercase tracking-[0.4em] relative z-10">
        ARGUS // On-chain Protection Layer
      </footer>
    </div>
  );
}

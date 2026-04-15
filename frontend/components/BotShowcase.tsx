'use client';

import { motion } from 'framer-motion';

export default function BotShowcase() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto border-t border-white/5 bg-base relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] hero-beam pointer-events-none opacity-10"></div>

      <div className="flex flex-col lg:flex-row items-center gap-20 relative z-10">
        
        {/* Left: Phone Mockup */}
        <div className="flex-1 w-full max-w-[400px]">
          <motion.div 
            initial={{ rotate: -5, y: 50, opacity: 0 }}
            whileInView={{ rotate: 10, y: 0, opacity: 1 }}
            className="relative bg-[#1A1C1E] rounded-[3rem] p-4 border-[8px] border-[#2C2E30] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] aspect-[9/18]"
          >
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#2C2E30] rounded-b-2xl z-20"></div>

            {/* Content (Telegram Interface) */}
            <div className="h-full w-full bg-[#0F1113] rounded-[2rem] overflow-hidden flex flex-col">
              <div className="p-6 bg-[#1A1C1E] border-b border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan flex items-center justify-center font-black text-white">A</div>
                <div>
                  <div className="text-sm font-black text-white uppercase italic">Argus Shield Bot</div>
                  <div className="text-[10px] text-cyan font-bold tracking-widest uppercase animate-pulse">Active Monitoring</div>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-4 font-sans">
                <TelegramMessage 
                  type="system" 
                  text="System initialized. Monitoring wallet: 0x71C...3E4D" 
                />
                <TelegramMessage 
                  type="alert" 
                  title="⚠️ CRITICAL ALERT"
                  text="Liquidity Drain detected in Uniswap ETH/USDC pool. Risk Score: 92/100." 
                  time="14:02"
                />
                <TelegramMessage 
                  type="alert" 
                  title="🚨 ACTION REQUIRED"
                  text="Whale wallet 0xab...f2 just moved $4M USDT. Potential depeg incoming." 
                  time="14:05"
                />
                <TelegramMessage 
                  type="system" 
                  text="Safe exit path identified: Swap to LUSD via Curve Finance." 
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 text-center lg:text-left">
          <div className="text-cyan text-xs font-black tracking-widest uppercase mb-4 italic">Direct Intelligence</div>
          <h2 className="text-4xl md:text-6xl font-black mb-8 uppercase tracking-tighter">Your Intelligence,<br/><span className="text-cyan">Delivered First.</span></h2>
          <p className="text-xl text-secondary mb-12 font-medium leading-relaxed">
            Stop refreshing dashboards. Get professional-grade risk escalations sent directly to your Telegram 
            <span className="text-white"> before</span> the rest of the market catches on. 
          </p>

          <div className="space-y-6 max-w-md mx-auto lg:mx-0">
            <FeatureItem title="Instant Push Alerts" desc="Zero latency propagation via our dedicated sentinel edge nodes." />
            <FeatureItem title="Protocol Agnostic" desc="Monitoring Uniswap, Curve, Aave, Lido, and 50+ other high-TVL apps." />
            <FeatureItem title="Actionable Intelligence" desc="Not just data. We provide specific exit paths and de-risking strategies." />
          </div>

          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://t.me/Argus_shield_bot" 
            target="_blank" 
            className="btn-primary mt-12 text-lg py-5 px-12 text-white"
          >
            Deploy My Sentinel Now →
          </motion.a>
        </div>
      </div>
    </section>
  );
}

function TelegramMessage({ type, title, text, time }: { type: 'system' | 'alert', title?: string, text: string, time?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: type === 'system' ? -10 : 10 }}
      whileInView={{ opacity: 1, x: 0 }}
      className={`max-w-[85%] p-3 rounded-2xl text-[12px] font-medium ${type === 'system' ? 'bg-[#212325] text-secondary self-start' : 'bg-red/10 border border-red/20 text-white self-end'}`}
    >
      {title && <div className="font-black text-red text-[10px] tracking-widest mb-1 uppercase italic">{title}</div>}
      {text}
      {time && <div className="text-[10px] text-muted text-right mt-1 font-bold">{time}</div>}
    </motion.div>
  );
}

function FeatureItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-5 h-5 rounded-full bg-cyan/20 flex items-center justify-center text-cyan shrink-0 mt-1">
        <svg fill="currentColor" viewBox="0 0 20 20" className="w-3 h-3"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      </div>
      <div>
        <div className="text-sm font-black text-white uppercase italic tracking-tight">{title}</div>
        <div className="text-xs text-secondary font-medium mt-1 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

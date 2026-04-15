'use client';

import React, { useState, useEffect } from 'react';
import { useArgusSocket, ProtocolScore, SignalEvent } from '@/hooks/useArgusSocket';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { scores, events, stats, status } = useArgusSocket();
  const [activeTab, setActiveTab] = useState<'risk' | 'feed' | 'detail'>('risk');
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolScore | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openProtocol = (p: ProtocolScore) => {
    setSelectedProtocol(p);
    setActiveTab('detail');
  };

  return (
    <div className="flex h-screen bg-base text-primary overflow-hidden selection:bg-cyan/30">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="mesh-background opacity-50"></div>
        <div className="grid-perspective opacity-10"></div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-24 border-r border-white/5 bg-surface/30 backdrop-blur-2xl flex flex-col items-center py-10 z-[100] relative">
        <div className="w-12 h-12 bg-gradient-to-tr from-cyan to-blue rounded-2xl flex items-center justify-center font-black text-white text-2xl mb-16 shadow-lg shadow-cyan/20 cursor-pointer hover:rotate-12 transition-transform">
          A
        </div>
        
        <nav className="flex flex-col gap-10">
          <SidebarLink 
            active={activeTab === 'risk'} 
            onClick={() => setActiveTab('risk')} 
            icon={<RiskIcon />} 
            label="RISK"
          />
          <SidebarLink 
            active={activeTab === 'feed'} 
            onClick={() => setActiveTab('feed')} 
            icon={<FeedIcon />} 
            label="FEED"
          />
        </nav>

        <div className="mt-auto p-4 flex flex-col items-center gap-6">
           {/* Status Indicator */}
           <div className="relative group">
             <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-cyan shadow-[0_0_15px_var(--cyan)]' : 'bg-red animate-pulse shadow-[0_0_15px_rgba(255,59,92,0.5)]'}`}></div>
             <div className="absolute left-full ml-4 px-3 py-1 bg-elevated rounded glass text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
               System: {status}
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 bg-surface/20 backdrop-blur-xl flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-secondary">
              {activeTab === 'risk' ? 'Risk Intelligence Map' : activeTab === 'feed' ? 'Live On-Chain Feed' : `Protocol Analysis: ${selectedProtocol?.name}`}
            </h2>
            <div className="h-6 w-px bg-white/5"></div>
            <div className="font-mono text-[10px] text-muted tracking-widest bg-white/5 px-3 py-1 rounded-full">{currentTime.toLocaleTimeString()} UTC</div>
          </div>
          
          <div className="flex items-center gap-8">
             <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-cyan/5 border border-cyan/10 rounded-full">
               <span className="w-2 h-2 rounded-full bg-cyan animate-pulse shadow-[0_0_10px_var(--cyan)]"></span>
               <span className="text-[10px] font-black uppercase tracking-widest text-cyan">Sentinel Defense v2.4</span>
             </div>
             <button 
                onClick={() => window.location.href = '/'} 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-white transition-all hover:bg-white/5 px-4 py-2 rounded-lg"
             >
                Terminate Session
             </button>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            {activeTab === 'risk' && (
              <motion.div 
                key="risk"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {scores.map((p) => (
                    <ProtocolCard key={p.id} protocol={p} onClick={() => openProtocol(p)} />
                  ))}
                  {scores.length === 0 && <EmptyState label="Awaiting Market Pulse..." />}
                </div>
              </motion.div>
            )}

            {activeTab === 'feed' && (
              <motion.div 
                key="feed"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto space-y-4"
              >
                {events.map((e) => (
                  <FeedItem key={e.id} event={e} />
                ))}
                {events.length === 0 && <EmptyState label="Silent Wires. No Events Detected." />}
              </motion.div>
            )}

            {activeTab === 'detail' && selectedProtocol && (
              <motion.div 
                key="detail"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="max-w-7xl mx-auto space-y-10"
              >
                {/* Back Button */}
                <button 
                  onClick={() => setActiveTab('risk')}
                  className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted hover:text-cyan transition-colors group"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Intelligence Map
                </button>

                <div className="grid lg:grid-cols-3 gap-10">
                  {/* Left: Chart & Info */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="glass-premium h-[600px] rounded-[2rem] overflow-hidden border-white/5 shadow-2xl relative">
                      <iframe 
                        src={`https://dexscreener.com/${selectedProtocol.dexScreenerChain || 'ethereum'}/${selectedProtocol.dexScreenerPair || '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640'}?embed=1&theme=dark&trades=0&info=0`}
                        className="w-full h-full border-none grayscale-[0.3] hover:grayscale-0 transition-all duration-700"
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="glass-premium p-8 rounded-[2rem] border-white/5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-8">Signal Matrix Breakdown</h4>
                        <div className="space-y-6">
                          {Object.entries(selectedProtocol.signals).map(([key, signal]) => (
                            <div key={key} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-secondary">{key.replace('_', ' ')}</span>
                                <span className={signal.pts / signal.max > 0.6 ? 'text-red' : 'text-cyan'}>{signal.pts} / {signal.max}</span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(signal.pts / signal.max) * 100}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className={`h-full transition-all duration-1000 ${signal.pts / signal.max > 0.6 ? 'bg-red shadow-[0_0_10px_rgba(255,59,92,0.5)]' : (signal.pts / signal.max > 0.3 ? 'bg-orange shadow-[0_0_10px_rgba(255,122,47,0.5)]' : 'bg-cyan shadow-[0_0_10px_var(--cyan)]')}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="glass-premium p-8 rounded-[2rem] border-white/5 flex flex-col justify-center items-center text-center relative overflow-hidden">
                         <div className="absolute inset-0 bg-cyan/5 hero-beam opacity-20"></div>
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-6 relative z-10">Real-time Contagion</h4>
                         <div className={`text-9xl font-black mb-4 relative z-10 tracking-tighter ${selectedProtocol.score > 70 ? 'text-red glow-red' : (selectedProtocol.score > 45 ? 'text-orange' : 'text-cyan glow-text')}`}>
                           {selectedProtocol.score}
                         </div>
                         <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border relative z-10 ${selectedProtocol.alert_level === 'RED' ? 'bg-red/10 text-red border-red/20' : 'bg-cyan/10 text-cyan border-cyan/20'}`}>
                           {selectedProtocol.alert_level} RISK ESCALATION
                         </div>

                         {selectedProtocol.market_trends && (
                           <div className="mt-10 pt-10 border-t border-white/5 w-full grid grid-cols-2 gap-6 relative z-10">
                             <div className="text-left">
                               <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">24H Volume</div>
                               <div className="text-lg font-black text-secondary tracking-tight">${(selectedProtocol.market_trends.volume24h / 1000000).toFixed(1)}M</div>
                             </div>
                             <div className="text-left">
                               <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Liquidity</div>
                               <div className="text-lg font-black text-secondary tracking-tight">${(selectedProtocol.market_trends.liquidityUsd / 1000000).toFixed(1)}M</div>
                             </div>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Intel for this Protocol */}
                  <div className="space-y-8">
                     <div className="glass-premium p-8 rounded-[2rem] border-white/5 min-h-[500px]">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-10">Sentinel Logs</h4>
                        <div className="space-y-8 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5 ml-2"></div>
                          {events.filter(e => e.protocol_name === selectedProtocol.name).map(e => (
                             <div key={e.id} className="pl-8 relative">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-base border-2 border-white/10 group-hover:border-cyan transition-colors ml-0.5 z-10"></div>
                                <div className="flex items-center gap-3 mb-2">
                                   <span className="font-mono text-[9px] text-muted">{e.time_ago}</span>
                                   <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase border glass ${e.badge_color === 'red' ? 'text-red border-red/20' : 'text-cyan border-cyan/20'}`}>{e.event_type}</span>
                                </div>
                                <p className="text-sm font-black tracking-tight mb-1">{e.title}</p>
                                <p className="text-xs text-secondary leading-relaxed">{e.description}</p>
                             </div>
                          ))}
                          {events.filter(e => e.protocol_name === selectedProtocol.name).length === 0 && (
                            <div className="text-center py-20 text-[10px] text-muted uppercase tracking-[0.3em] italic leading-loose">No protocol-specific events recorded in this cycle.</div>
                          )}
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-2 group transition-all relative ${active ? 'text-cyan' : 'text-muted hover:text-secondary'}`}
    >
      <div className={`p-4 rounded-2xl transition-all duration-500 ${active ? 'bg-cyan/10 ring-1 ring-cyan/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'hover:bg-white/5'}`}>
        {icon}
      </div>
      <span className="text-[8px] font-black tracking-[0.2em] transition-all opacity-0 group-hover:opacity-100">{label}</span>
      {active && <motion.div layoutId="activeNav" className="absolute -right-[49px] w-1 h-8 bg-cyan rounded-l-full shadow-[0_0_10px_var(--cyan)]" />}
    </button>
  );
}

function ProtocolCard({ protocol, onClick }: { protocol: ProtocolScore, onClick: () => void }) {
  const getSeverity = (score: number) => {
    if (score > 70) return { color: 'text-red', glow: 'glow-red', bg: 'bg-red/10', border: 'border-red/20', badge: 'DANGER', pulse: true };
    if (score > 45) return { color: 'text-orange', glow: '', bg: 'bg-orange/10', border: 'border-orange/20', badge: 'WARNING', pulse: false };
    return { color: 'text-cyan', glow: 'glow-blue', bg: 'bg-cyan/10', border: 'border-cyan/20', badge: 'SECURE', pulse: false };
  };

  const sev = getSeverity(protocol.score);

  return (
    <motion.div 
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      onClick={onClick} 
      className="glass-premium p-8 flex flex-col h-[320px] cursor-pointer group border-white/5 relative overflow-hidden rounded-[2.5rem]"
    >
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 group-hover:rotate-12 transition-all duration-700">
         <span className="text-8xl font-black italic">{protocol.chain.toUpperCase()}</span>
      </div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-1 leading-none group-hover:text-cyan transition-colors">{protocol.name}</h3>
          <span className="text-[10px] font-bold tracking-[0.2em] text-muted">{protocol.chain.toUpperCase()} NETWORK sentinel</span>
        </div>
        <div className={`px-3 py-1 rounded text-[9px] font-black tracking-widest border ${sev.bg} ${sev.color} ${sev.border} ${sev.pulse ? 'animate-pulse' : ''}`}>
          {sev.badge}
        </div>
      </div>

      <div className="flex items-end justify-between mt-auto relative z-10">
        <div className="space-y-1">
          <div className="text-[10px] font-black text-muted tracking-widest uppercase">Risk Score</div>
          <div className={`text-7xl font-black tracking-tighter leading-none ${sev.color} ${sev.glow}`}>
            {protocol.score}
          </div>
        </div>
        
        <div className="text-right space-y-1">
          {protocol.market_trends ? (
            <>
              <div className="text-[9px] font-black text-muted uppercase tracking-widest">24H VOL</div>
              <div className="text-sm font-black text-secondary">{protocol.market_trends.volume24h > 1000000 ? `${(protocol.market_trends.volume24h / 1000000).toFixed(1)}M` : (protocol.market_trends.volume24h / 1000).toFixed(1) + 'K'}</div>
              <div className="text-[9px] font-black text-muted uppercase tracking-widest pt-2">LIQUIDITY</div>
              <div className="text-sm font-black text-secondary">${(protocol.market_trends.liquidityUsd / 1000000).toFixed(1)}M</div>
            </>
          ) : (
            <>
              <div className="text-[9px] font-black text-muted uppercase tracking-widest">Live TVL</div>
              <div className="text-sm font-black text-secondary">{protocol.tvl_formatted}</div>
            </>
          )}
        </div>
      </div>

      {/* Simplified Sparkline */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-10 group-hover:opacity-30 p-2 pointer-events-none transition-all duration-700">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={(protocol.tvl_history || [40, 45, 42, 48, 46, 50, 49]).map((v, i) => ({ v, i }))}>
            <Line type="monotone" dataKey="v" stroke={sev.color.includes('cyan') ? '#06B6D4' : '#FF3B5C'} strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Scanning Line Animation on Card */}
      <div className="absolute inset-0 scanner-line opacity-0 group-hover:opacity-10 transition-opacity"></div>
    </motion.div>
  );
}

function FeedItem({ event }: { event: SignalEvent }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      className="glass-premium p-6 hover:bg-white/5 flex items-start gap-6 rounded-2xl border-white/5 group transition-all"
    >
      <div className="pt-1 font-mono text-[9px] text-muted shrink-0 w-20 tracking-tighter">{event.time_ago}</div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-4">
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border glass ${event.badge_color === 'red' ? 'text-red border-red/20' : 'text-cyan border-cyan/20'}`}>
            {event.event_type.replace('_', ' ')}
          </span>
          <span className="text-xs font-black uppercase italic tracking-tighter text-secondary group-hover:text-white transition-colors">{event.protocol_name} intelligence</span>
        </div>
        <p className="text-base font-black tracking-tight text-white/90">{event.title}</p>
        <p className="text-sm text-secondary font-medium leading-relaxed">{event.description}</p>
        {event.wallet && (
          <div className="flex items-center gap-3 pt-2 font-mono text-[9px] text-muted">
             <span className="uppercase font-black text-cyan/50 tracking-widest">Source:</span>
             <span className="hover:text-cyan cursor-pointer transition-all break-all">{event.wallet_full}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="col-span-full py-40 text-center glass-premium border-dashed border-white/5 rounded-[3rem] flex flex-col items-center gap-8">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-white/5 border-t-cyan rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-xs">🌐</div>
      </div>
      <p className="text-secondary font-black text-xs uppercase tracking-[0.5em]">{label}</p>
    </div>
  );
}

function RiskIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}

function FeedIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
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


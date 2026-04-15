'use client';

import React, { useState, useEffect } from 'react';
import { useArgusSocket, ProtocolScore, SignalEvent } from '@/hooks/useArgusSocket';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

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
    <div className="flex h-screen bg-base text-primary font-syne overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-16 md:w-20 border-r border-border bg-surface flex flex-col items-center py-8 z-50">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center font-black text-black text-2xl mb-12 italic">A</div>
        
        <nav className="flex flex-col gap-8 flex-1">
          <button onClick={() => setActiveTab('risk')} className={`p-3 rounded-xl transition-all ${activeTab === 'risk' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted hover:text-secondary'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </button>
          <button onClick={() => setActiveTab('feed')} className={`p-3 rounded-xl transition-all ${activeTab === 'feed' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted hover:text-secondary'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </button>
        </nav>

        <div className="mt-auto p-4 flex flex-col items-center gap-4">
           {/* Status Dot */}
           <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green' : 'bg-red animate-pulse'}`} title={status}></div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-base overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold tracking-widest uppercase text-secondary">
              {activeTab === 'risk' ? 'Risk Intelligence Map' : activeTab === 'feed' ? 'Live On-Chain Feed' : `Protocol Analysis: ${selectedProtocol?.name}`}
            </h2>
            <div className="h-4 w-px bg-border"></div>
            <span className="font-mono text-xs text-muted tracking-widest">{currentTime.toLocaleTimeString()} UTC</span>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green' : 'bg-orange animate-pulse'}`}></span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-secondary">
                  {status === 'connected' ? 'Live System' : 'Reconnecting...'}
                </span>
             </div>
             <button onClick={() => window.location.href = '/'} className="text-[10px] font-bold uppercase tracking-tighter text-muted hover:text-primary transition-colors">Terminate Session</button>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeTab === 'risk' && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                {scores.map((p) => (
                  <ProtocolCard key={p.id} protocol={p} onClick={() => openProtocol(p)} />
                ))}
                {scores.length === 0 && (
                  <div className="col-span-full py-20 text-center card bg-surface/20 border-dashed border-border flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-border border-t-accent rounded-full animate-spin"></div>
                    <p className="text-secondary font-mono text-sm uppercase tracking-widest">Awaiting Pulse Cycle...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="max-w-3xl mx-auto animate-slide-up">
              <div className="flex flex-col gap-4">
                {events.map((e) => (
                  <FeedItem key={e.id} event={e} />
                ))}
                {events.length === 0 && (
                  <div className="text-center py-20 text-muted font-mono text-sm tracking-widest uppercase italic">
                    Silent wires. Monitoring for event spikes...
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'detail' && selectedProtocol && (
            <div className="max-w-7xl mx-auto animate-fade-in space-y-8">
              {/* Back Button */}
              <button 
                onClick={() => setActiveTab('risk')}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary hover:text-accent transition-colors"
              >
                ← Back to Risk Map
              </button>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Chart & Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="card h-[500px] overflow-hidden relative">
                    <iframe 
                      src={`https://dexscreener.com/${selectedProtocol.dexScreenerChain || 'ethereum'}/${selectedProtocol.dexScreenerPair || '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640'}?embed=1&theme=dark&trades=0&info=0`}
                      className="w-full h-full border-none"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="card p-6">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Signal Breakdown</h4>
                      <div className="space-y-4">
                        {Object.entries(selectedProtocol.signals).map(([key, signal]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                              <span className="text-secondary">{key.replace('_', ' ')}</span>
                              <span>{signal.pts} / {signal.max}</span>
                            </div>
                            <div className="h-1 bg-border rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${signal.pts / signal.max > 0.6 ? 'bg-red' : (signal.pts / signal.max > 0.3 ? 'bg-orange' : 'bg-green')}`}
                                style={{ width: `${(signal.pts / signal.max) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card p-6 flex flex-col justify-center items-center text-center">
                       <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Current Contagion Score</h4>
                       <div className={`text-7xl font-mono font-black mb-2 ${selectedProtocol.score > 70 ? 'text-red' : (selectedProtocol.score > 45 ? 'text-orange' : (selectedProtocol.score > 20 ? 'text-yellow' : 'text-green'))}`}>
                         {selectedProtocol.score}
                       </div>
                       <div className={`badge ${selectedProtocol.alert_level === 'RED' ? 'bg-red/10 text-red border-red/20' : (selectedProtocol.alert_level === 'ORANGE' ? 'bg-orange/10 text-orange border-orange/20' : (selectedProtocol.alert_level === 'YELLOW' ? 'bg-yellow/10 text-yellow border-yellow/20' : 'bg-green/10 text-green border-green/20'))}`}>
                         {selectedProtocol.alert_level} RISK
                       </div>

                       {selectedProtocol.market_trends && (
                         <div className="mt-8 pt-8 border-t border-border w-full grid grid-cols-2 gap-4">
                           <div className="text-left">
                             <div className="text-[10px] font-bold text-muted uppercase tracking-widest">24H Volume</div>
                             <div className="font-mono text-sm tracking-tighter text-secondary">${(selectedProtocol.market_trends.volume24h / 1000000).toFixed(1)}M</div>
                           </div>
                           <div className="text-left">
                             <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Liquidity</div>
                             <div className="font-mono text-sm tracking-tighter text-secondary">${(selectedProtocol.market_trends.liquidity / 1000000).toFixed(1)}M</div>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                {/* Right: Live Intel for this Protocol */}
                <div className="space-y-6">
                   <div className="card p-6 min-h-[400px]">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-6">Recent Activity Intel</h4>
                      <div className="space-y-6">
                        {events.filter(e => e.protocol_name === selectedProtocol.name).map(e => (
                           <div key={e.id} className="border-l-2 border-border pl-4 space-y-1">
                              <div className="flex items-center gap-2">
                                 <span className="font-mono text-[10px] text-muted">{e.time_ago}</span>
                                 <span className={`text-[8px] px-1 rounded font-bold uppercase border border-${e.badge_color} text-${e.badge_color}`}>{e.event_type}</span>
                              </div>
                              <p className="text-xs font-bold">{e.title}</p>
                              <p className="text-[10px] text-secondary">{e.description}</p>
                           </div>
                        ))}
                        {events.filter(e => e.protocol_name === selectedProtocol.name).length === 0 && (
                          <div className="text-center py-20 text-[10px] text-muted uppercase tracking-widest">No protocol-specific events</div>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ProtocolCard({ protocol, onClick }: { protocol: ProtocolScore, onClick: () => void }) {
  const getSeverity = (score: number) => {
    if (score > 70) return { color: 'text-red', bg: 'bg-red/10', border: 'border-red/20', badge: 'DANGER', pulse: true };
    if (score > 45) return { color: 'text-orange', bg: 'bg-orange/10', border: 'border-orange/20', badge: 'WARNING', pulse: false };
    if (score > 20) return { color: 'text-yellow', bg: 'bg-yellow/10', border: 'border-yellow/20', badge: 'MONITOR', pulse: false };
    return { color: 'text-green', bg: 'bg-green/10', border: 'border-green/20', badge: 'SAFE', pulse: false };
  };

  const sev = getSeverity(protocol.score);

  return (
    <div onClick={onClick} className="card p-6 flex flex-col h-full cursor-pointer hover:scale-[1.01] active:scale-[0.99] group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
         <span className="text-7xl font-black italic">{protocol.chain.toUpperCase()}</span>
      </div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-extrabold italic uppercase tracking-tighter mb-1 leading-none">{protocol.name}</h3>
          <span className="text-[10px] font-mono font-bold tracking-widest text-muted">{protocol.chain.toUpperCase()}</span>
        </div>
        <div className={`badge ${sev.bg} ${sev.color} ${sev.border} ${sev.pulse ? 'animate-pulse' : ''}`}>
          {sev.badge}
        </div>
      </div>

      <div className="flex items-end justify-between mt-auto relative z-10">
        <div className="space-y-2">
          <div className="text-xs font-bold text-secondary tracking-widest uppercase">Contagion Score</div>
          <div className={`text-6xl font-mono font-black ${sev.color} leading-none tracking-tighter`}>
            {protocol.score}
          </div>
        </div>
        
        <div className="text-right space-y-1">
          {protocol.market_trends ? (
            <>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest">24H VOL</div>
              <div className="font-mono text-sm text-secondary">${(protocol.market_trends.volume24h / 1000000).toFixed(1)}M</div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">LIQUIDITY</div>
              <div className="font-mono text-sm">{protocol.tvl_formatted}</div>
            </>
          ) : (
            <>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Live TVL</div>
              <div className="font-mono text-sm">{protocol.tvl_formatted}</div>
            </>
          )}
          <div className={`text-[10px] font-bold ${protocol.price_change_1h >= 0 ? 'text-green' : 'text-red'}`}>
            {protocol.price_change_1h >= 0 ? '+' : ''}{protocol.price_change_1h}%
          </div>
        </div>
      </div>

      {/* Simplified Sparkline */}
      <div className="h-12 w-full mt-6 -mx-6 -mb-6 opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={(protocol.tvl_history || [40, 45, 42, 48, 46, 50, 49]).map((v, i) => ({ v, i }))}>
            <Line type="monotone" dataKey="v" stroke={sev.color.replace('text-', '#')} strokeWidth={2} dot={false} />
            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FeedItem({ event }: { event: SignalEvent }) {
  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red/10 text-red border-red/20';
      case 'orange': return 'bg-orange/10 text-orange border-orange/20';
      case 'yellow': return 'bg-yellow/10 text-yellow border-yellow/20';
      default: return 'bg-green/10 text-green border-green/20';
    }
  };

  return (
    <div className="card p-4 hover:bg-elevated flex items-start gap-4 animate-slide-up">
      <div className="pt-1 font-mono text-[10px] text-muted shrink-0 w-16">{event.time_ago}</div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-3">
          <span className={`badge ${getBadgeColor(event.badge_color)}`}>{event.event_type.replace('_', ' ')}</span>
          <span className="text-xs font-extrabold uppercase italic tracking-tighter">{event.protocol_name}</span>
        </div>
        <p className="text-sm font-bold text-primary">{event.title}</p>
        <p className="text-xs text-secondary leading-relaxed">{event.description}</p>
        {event.wallet && (
          <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-muted">
             <span className="uppercase tracking-tighter">Addr:</span>
             <span className="hover:text-accent cursor-pointer transition-colors transition-all break-all">{event.wallet_full}</span>
          </div>
        )}
      </div>
    </div>
  );
}

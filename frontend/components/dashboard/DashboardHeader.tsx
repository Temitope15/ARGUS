'use client';

import React, { useState, useEffect } from 'react';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';

interface DashboardHeaderProps {
  status: 'connected' | 'connecting' | 'disconnected';
}

export const DashboardHeader = ({ status }: DashboardHeaderProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-14 bg-surface border-b border-border px-6 flex items-center justify-between shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="#FF6B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="3" fill="#FF6B2B" />
        </svg>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white tracking-tight">ARGUS</span>
          <div className="w-px h-4 bg-border" />
          <span className="text-secondary text-xs font-medium">DeFi Contagion Shield</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-8">
        <ConnectionStatus status={status} />
        
        <div className="font-mono text-secondary text-xs tracking-widest uppercase">
          {time.toISOString().split('T')[1].split('.')[0]} UTC
        </div>

        <div className="bg-argus/10 border border-argus/20 text-argus text-[10px] font-mono px-3 py-1 rounded-full font-bold">
          AVE CLAW 2026
        </div>
      </div>
    </header>
  );
};

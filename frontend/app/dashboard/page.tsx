'use client';

import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ContagionBanner } from '@/components/dashboard/ContagionBanner';
import { SystemStats } from '@/components/dashboard/SystemStats';
import { ProtocolGrid } from '@/components/dashboard/ProtocolGrid';
import { LiveFeed } from '@/components/dashboard/LiveFeed';
import { PositionsScanner } from '@/components/dashboard/PositionsScanner';
import { useArgusSocket } from '@/hooks/useArgusSocket';
import { useMockData } from '@/hooks/useMockData';

export default function DashboardPage() {
  const [viewMode, setViewMode] = React.useState<'markets' | 'positions'>('markets');
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  const liveData = useArgusSocket();
  const mockData = useMockData();

  // Pick data source
  const scores = isMockMode ? mockData.scores : liveData.scores;
  const events = isMockMode ? mockData.events : liveData.events;
  const status = isMockMode ? 'connected' : liveData.status;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-void overflow-hidden">
      <DashboardHeader status={status as any} />
      
      <ContagionBanner scores={scores} />
      
      <SystemStats scores={scores} status={status} />

      {/* Tabs */}
      <div className="px-6 flex gap-8 border-b border-border mb-6">
        <button 
          onClick={() => setViewMode('markets')}
          className={`pb-4 text-sm font-bold transition-colors relative ${viewMode === 'markets' ? 'text-white' : 'text-secondary hover:text-white'}`}
        >
          Risk Markets
          {viewMode === 'markets' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-argus" />}
        </button>
        <button 
          onClick={() => setViewMode('positions')}
          className={`pb-4 text-sm font-bold transition-colors relative ${viewMode === 'positions' ? 'text-white' : 'text-secondary hover:text-white'}`}
        >
          My Positions
          {viewMode === 'positions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-argus" />}
        </button>
      </div>

      <main className="flex-1 flex min-h-0 px-6 pb-6 gap-6">
        {viewMode === 'markets' ? (
          <>
            {/* Left Column: Protocols */}
            <section className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <ProtocolGrid scores={scores} />
            </section>

            {/* Right Column: Live Feed */}
            <aside className="w-[380px] flex flex-col glass-card rounded-2xl p-5 border-border/40 shrink-0">
              <LiveFeed events={events} />
            </aside>
          </>
        ) : (
          <PositionsScanner />
        )}
      </main>

      {/* Background Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-argus/5 blur-[150px] -z-10" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-argus/5 blur-[150px] -z-10" />
    </div>
  );
}

'use client';

import React from 'react';
import { ArrowDownLeft, Brain, AlertTriangle, TrendingDown } from 'lucide-react';
import { SignalEvent } from '@/lib/mockData';

interface LiveFeedProps {
  events: SignalEvent[];
}

const ICON_MAP = {
  lp_removal: ArrowDownLeft,
  smart_money_exit: Brain,
  depeg_detected: AlertTriangle,
  holder_exit: TrendingDown,
};

const SEVERITY_COLOR = {
  low: 'bg-amber-500/50',
  medium: 'bg-orange-600/70',
  high: 'bg-red-500',
};

const ICON_COLOR = {
  lp_removal: 'text-orange-400',
  smart_money_exit: 'text-red-400',
  depeg_detected: 'text-amber-400',
  holder_exit: 'text-red-500',
};

export const LiveFeed = ({ events }: LiveFeedProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center pb-4 border-b border-border">
        <h3 className="text-primary font-semibold text-sm">Live Signal Feed</h3>
        <div className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1.5">
          <div className="w-1 h-1 bg-current rounded-full" />
          LIVE MONITORING
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-0 pr-2 custom-scrollbar">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <div className="w-12 h-12 rounded-full border border-dashed border-muted flex items-center justify-center mb-4">
              <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
            </div>
            <p className="text-muted text-xs font-mono">STANDBY — LISTENING FOR SIGNALS</p>
          </div>
        ) : (
          events.map((event) => {
            const Icon = ICON_MAP[event.type];
            return (
              <div key={event.id} className="py-3 border-b border-border/50 flex gap-3 items-start animate-slide-left hover:bg-white/[0.02] transition-colors px-2">
                <div className={`w-0.5 self-stretch rounded-full ${SEVERITY_COLOR[event.severity]}`} />
                
                <div className={`flex-shrink-0 mt-0.5 ${ICON_COLOR[event.type]}`}>
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-primary text-[11px] leading-relaxed font-medium">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted text-[9px] font-mono uppercase tracking-wider">{event.protocolId}</span>
                    {event.amountUsd && (
                      <>
                        <span className="text-muted/30">·</span>
                        <span className="text-red-400/80 text-[10px] font-mono font-bold">
                          ${(event.amountUsd / 1000).toFixed(0)}K
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 text-muted text-[10px] font-mono whitespace-nowrap pt-0.5">
                  {_formatTimeAgo(event.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

function _formatTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

'use client';

import React from 'react';

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
}

export const ConnectionStatus = ({ status }: ConnectionStatusProps) => {
  const config = {
    connected: { color: 'bg-emerald-500', text: 'STABLE' },
    connecting: { color: 'bg-amber-500 animate-pulse', text: 'CONNECTING' },
    disconnected: { color: 'bg-red-500', text: 'OFFLINE' },
  };

  const { color, text } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`relative flex h-2 w-2`}>
        {status === 'connected' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`}></span>
      </div>
      <span className="text-[10px] font-mono font-bold tracking-widest text-secondary">
        {text}
      </span>
    </div>
  );
};

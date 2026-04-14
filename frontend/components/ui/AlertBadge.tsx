import React from 'react';

interface AlertBadgeProps {
  level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
}

export const AlertBadge = ({ level }: AlertBadgeProps) => {
  const styles = {
    GREEN: "bg-emerald-950/30 text-emerald-400 border-emerald-900/50",
    YELLOW: "bg-amber-950/30 text-amber-400 border-amber-900/50",
    ORANGE: "bg-orange-950/30 text-orange-400 border-orange-900/50",
    RED: "bg-red-950/30 text-red-400 border-red-900/50 animate-pulse",
  };

  const labels = {
    GREEN: "SAFE",
    YELLOW: "MONITOR",
    ORANGE: "WARNING",
    RED: "DANGER",
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${styles[level]}`}>
      <div className={`w-1 h-1 rounded-full bg-current ${level === 'RED' ? 'animate-ping' : ''}`} />
      {labels[level]}
    </div>
  );
};

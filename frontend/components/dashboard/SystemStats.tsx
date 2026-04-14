'use client';

import React from 'react';
import { ProtocolScore } from '@/lib/mockData';

interface SystemStatsProps {
  scores: ProtocolScore[];
  status: string;
}

export const SystemStats = ({ scores, status }: SystemStatsProps) => {
  const activeAlerts = scores.filter(s => s.score >= 21).length;
  const highestRiskProto = scores.reduce((prev, current) => (prev.score > current.score) ? prev : current, scores[0]);
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4 bg-void shrink-0">
      {/* 01: Protocols */}
      <StatCard 
        label="Protocols Monitored" 
        value={scores.length.toString()} 
        subtext="ETH + BSC Mainnets" 
      />

      {/* 02: Alerts */}
      <StatCard 
        label="Active Alerts" 
        value={activeAlerts.toString()} 
        subtext={activeAlerts > 0 ? "Elevated risk detected" : "All systems normal"} 
        valueColor={activeAlerts > 0 ? "text-orange-400" : "text-emerald-400"}
      />

      {/* 03: Highest Risk */}
      <StatCard 
        label="Highest Risk" 
        value={highestRiskProto?.score.toString()} 
        subtext={highestRiskProto?.protocolName || "None"}
        valueColor={
          highestRiskProto?.alertLevel === 'RED' ? 'text-red-500' :
          highestRiskProto?.alertLevel === 'ORANGE' ? 'text-orange-400' :
          highestRiskProto?.alertLevel === 'YELLOW' ? 'text-amber-500' : 'text-emerald-400'
        }
      />

      {/* 04: System Status */}
      <StatCard 
        label="System Mode" 
        value={isMockMode ? "MOCK" : "LIVE"} 
        subtext={status === 'connected' ? "Data bridge active" : "Reconnecting..."}
        valueColor={isMockMode ? "text-amber-400" : "text-emerald-400"}
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  valueColor?: string;
}

const StatCard = ({ label, value, subtext, valueColor = "text-primary" }: StatCardProps) => (
  <div className="bg-surface border border-border rounded-xl p-4 hover:border-argus/20 transition-all duration-300">
    <div className="text-muted text-[10px] font-mono tracking-widest uppercase mb-2">{label}</div>
    <div className={`font-mono text-2xl font-bold ${valueColor}`}>{value}</div>
    <div className="text-secondary text-[10px] mt-1 font-medium">{subtext}</div>
  </div>
);

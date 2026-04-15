'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { PortfolioSnapshot } from '@/hooks/usePortfolio';

interface PnLChartProps {
  snapshots: PortfolioSnapshot[];
}

export function PnLChart({ snapshots }: PnLChartProps) {
  const data = snapshots.map(s => ({
    time: new Date(s.snapshotted_at * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    value: Math.round(s.total_value_usd * 100) / 100,
    pnl: Math.round(s.total_pnl_usd * 100) / 100
  }));

  const isPositive = data.length > 0 && data[data.length - 1].pnl >= 0;
  const lineColor = isPositive ? '#34D399' : '#F87171';
  const gradientId = 'pnlGradient';

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            stroke="#3D4B5C"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#3D4B5C"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111720',
              border: '1px solid #1C2333',
              borderRadius: '12px',
              color: '#EDF2F7',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace'
            }}
            formatter={(value: number, name: string) => [
              `$${value.toFixed(2)}`,
              name === 'value' ? 'Portfolio Value' : 'P&L'
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: lineColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import React from 'react';
import { ALERT_COLORS } from '@/lib/alertColors';

interface ScoreGaugeProps {
  score: number;
  alertLevel: keyof typeof ALERT_COLORS;
  size?: number;
}

export const ScoreGauge = ({ score, alertLevel, size = 120 }: ScoreGaugeProps) => {
  const colors = ALERT_COLORS[alertLevel];
  
  const R = 52;
  const CX = 60, CY = 60;
  const CIRCUMFERENCE = 2 * Math.PI * R;          // 326.73
  const ARC = CIRCUMFERENCE * 0.75;               // 245.04 (270° of 360°)
  const offset = ARC - (score / 100) * ARC;

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="overflow-visible">
      {/* Track arc */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke="#1C2333"
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={`${ARC} ${CIRCUMFERENCE - ARC}`}
        strokeDashoffset={0}
        transform="rotate(135, 60, 60)"
      />
      
      {/* Score arc */}
      <circle
        cx={CX} cy={CY} r={R}
        fill="none"
        stroke={colors.stroke}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={`${ARC} ${CIRCUMFERENCE - ARC}`}
        strokeDashoffset={offset}
        transform="rotate(135, 60, 60)"
        style={{ 
          transition: 'stroke-dashoffset 700ms ease-out, stroke 700ms ease',
          filter: alertLevel === 'RED' 
            ? 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' 
            : 'none'
        }}
      />
      
      {/* Score number */}
      <text
        x={CX} y={CY - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="700"
        fontSize={score >= 100 ? 20 : 26}
        fill={colors.text}
      >
        {Math.round(score)}
      </text>
      
      {/* /100 label */}
      <text
        x={CX} y={CY + 18}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize={10}
        fill="#3D4B5C"
      >
        /100
      </text>
    </svg>
  );
};

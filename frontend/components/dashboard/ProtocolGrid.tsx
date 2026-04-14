'use client';

import React from 'react';
import { ProtocolScore } from '@/lib/mockData';
import { ProtocolCard } from '@/components/dashboard/ProtocolCard';

interface ProtocolGridProps {
  scores: ProtocolScore[];
}

export const ProtocolGrid = ({ scores }: ProtocolGridProps) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {scores.map((score) => (
        <ProtocolCard key={score.protocolId} data={score} />
      ))}
    </div>
  );
};

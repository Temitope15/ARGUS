'use client';

import { useState, useEffect } from 'react';
import { ProtocolScore, SignalEvent, INITIAL_MOCK_SCORES, MOCK_EVENT_TEMPLATES } from '../lib/mockData';
import { scoreToLevel } from '../lib/alertColors';

export function useMockData() {
  const [scores, setScores] = useState<ProtocolScore[]>(INITIAL_MOCK_SCORES);
  const [events, setEvents] = useState<SignalEvent[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Pick 1-2 random protocols to update
      const updateCount = Math.random() > 0.5 ? 2 : 1;
      const nextScores = [...scores];
      
      for (let i = 0; i < updateCount; i++) {
        const index = Math.floor(Math.random() * nextScores.length);
        const p = { ...nextScores[index] };
        
        // Adjust score ±4 to ±9 (60% upward weight for drama)
        const direction = Math.random() > 0.4 ? 1 : -1;
        const change = (Math.floor(Math.random() * 6) + 4) * direction;
        
        p.score = Math.min(100, Math.max(0, p.score + change));
        p.alertLevel = scoreToLevel(p.score);
        p.computedAt = Date.now();
        
        // Update a random signal based on score change
        if (change > 0) {
          p.signals.tvlVelocityPts = Math.min(25, p.signals.tvlVelocityPts + Math.floor(change/2));
        }

        nextScores[index] = p;
      }

      // 2. Contagion Multiplier Logic
      const distressed = nextScores.filter(s => s.score >= 46);
      nextScores.forEach(s => s.contagionMultiplierApplied = false);
      
      if (distressed.length >= 2) {
        const highest = nextScores.reduce((prev, current) => (prev.score > current.score) ? prev : current);
        if (highest.score < 100) {
          highest.score = Math.min(100, Math.round(highest.score * 1.5));
          highest.contagionMultiplierApplied = true;
          highest.alertLevel = scoreToLevel(highest.score);
        }
      }

      setScores(nextScores);

      // 3. Random Event
      const template = MOCK_EVENT_TEMPLATES[Math.floor(Math.random() * MOCK_EVENT_TEMPLATES.length)];
      const newEvent: SignalEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: template.type as any,
        description: template.description,
        protocolId: nextScores[Math.floor(Math.random() * nextScores.length)].protocolId,
        severity: template.severity as any,
        amountUsd: Math.random() > 0.7 ? Math.floor(Math.random() * 2000000) + 100000 : undefined,
        timestamp: Date.now()
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 50));

    }, 8000);

    return () => clearInterval(interval);
  }, [scores]);

  return { scores, events };
}

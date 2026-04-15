'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export type ProtocolScore = {
  id: string;
  name: string;
  chain: string;
  dexScreenerPair?: string;
  dexScreenerChain?: string;
  score: number;
  alert_level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  tvl_usd: number;
  tvl_formatted: string;
  price_change_1h: number;
  market_trends?: {
    volume24h: number;
    liquidityUsd: number;
    priceChange24h: number;
  };
  signals: Record<string, { pts: number, max: number, detail?: string }>;
  last_event?: string;
  tvl_history?: number[];
};

export type SignalEvent = {
  id: string;
  timestamp: number;
  time_ago: string;
  protocol_name: string;
  event_type: 'WHALE_ENTRY' | 'LP_DRAIN' | 'DEPEG' | 'RISK_SPIKE' | 'SWAP';
  badge_color: string;
  title: string;
  description: string;
  wallet?: string;
  wallet_full?: string;
  amount_usd?: number;
  chain?: string;
};

let globalSocket: Socket | null = null;

// Ensure URL is absolute to avoid hitting Vercel domain for API calls
const getBackendUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl.startsWith('http')) return envUrl;
    // Hardcoded fallback if env is missing or invalid
    return 'https://argus-backend-tkgz.onrender.com';
};

export function useArgusSocket() {
  const [scores, setScores] = useState<ProtocolScore[]>([]);
  const [events, setEvents] = useState<SignalEvent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [status, setStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('reconnecting');
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    const url = getBackendUrl();

    if (!isInitialized.current) {
        // Initial fetch
        fetch(`${url}/api/protocols/scores`)
          .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
          })
          .then(data => {
            if (data && data.protocols) setScores(data.protocols);
          })
          .catch(err => console.error('Initial scores fetch failed:', err));
        
        fetch(`${url}/api/stats`)
          .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
          })
          .then(data => setStats(data))
          .catch(err => console.error('Initial stats fetch failed:', err));
          
        isInitialized.current = true;
    }

    if (!globalSocket) {
      globalSocket = io(url, {
        transports: ['websocket'],
        reconnectionAttempts: Infinity,
      });
    }

    const socket = globalSocket;
    if (socket.connected) setStatus('connected');

    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('reconnecting');
    const onScoresUpdate = (data: { protocols: ProtocolScore[] }) => setScores(data.protocols);
    const onFeedUpdate = (data: { events: SignalEvent[] }) => setEvents(prev => [...data.events, ...prev].slice(0, 50));
    const onStatsUpdate = (data: any) => setStats(data);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('scores_update', onScoresUpdate);
    socket.on('feed_update', onFeedUpdate);
    socket.on('stats_update', onStatsUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('scores_update', onScoresUpdate);
      socket.off('feed_update', onFeedUpdate);
      socket.off('stats_update', onStatsUpdate);
    };
  }, []);

  return { scores, events, stats, status };
}

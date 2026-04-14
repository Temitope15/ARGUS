'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ProtocolScore, SignalEvent } from '../lib/mockData';

export function useArgusSocket() {
  const [scores, setScores] = useState<ProtocolScore[]>([]);
  const [events, setEvents] = useState<SignalEvent[]>([]);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';
    const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

    if (isMockMode) {
      setStatus('connected');
      return;
    }

    // Fetch initial scores from REST API so we don't present an empty screen while waiting for the next WS broadcast
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || url;
    fetch(`${apiUrl}/api/scores/latest`)
      .then(res => res.json())
      .then(data => {
        if (data && data.scores) {
          // Only set scores if they haven't been set by WS yet
          setScores(prev => prev.length === 0 ? data.scores : prev);
        }
      })
      .catch(err => console.error('Failed to fetch initial scores:', err));

    const socket = io(url, {
      transports: ['polling', 'websocket'],
      withCredentials: false,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      console.log('Argus Socket Connected');
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setStatus('connecting');
    });

    socket.on('scores_updated', (data: { scores: ProtocolScore[] }) => {
      setScores(data.scores);
    });

    socket.on('signal_event', (event: SignalEvent) => {
      setEvents(prev => [event, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { scores, events, status };
}

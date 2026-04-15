'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ProtocolScore, SignalEvent } from '../lib/mockData';

// Singleton socket instance to avoid StrictMode double-mounting connections and XHR polling aborts
let globalSocket: Socket | null = null;

export function useArgusSocket() {
  const [scores, setScores] = useState<ProtocolScore[]>([]);
  const [events, setEvents] = useState<SignalEvent[]>([]);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';
    const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

    if (isMockMode) {
      setStatus('connected');
      return;
    }

    if (!isInitialized.current) {
        // Fetch initial scores from REST API so we don't present an empty screen while waiting for the next WS broadcast
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || url;
        fetch(`${apiUrl}/api/scores/latest`)
          .then(res => res.json())
          .then(data => {
            if (data && data.scores) {
              setScores(prev => prev.length === 0 ? data.scores : prev);
            }
          })
          .catch(err => console.error('Failed to fetch initial scores:', err));
        isInitialized.current = true;
    }

    if (!globalSocket) {
      globalSocket = io(url, {
        transports: ['websocket', 'polling'], // Prefer websockets directly to avoid Next.js StrictMode NS_BINDING_ABORTED on XHR
        withCredentials: false,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        timeout: 10000,
      });
    }

    const socket = globalSocket;

    let isMounted = true;

    // Immediately sync status
    if (socket.connected) {
      setStatus('connected');
    }

    const onConnect = () => {
      console.log('Argus Socket Connected');
      isMounted && setStatus('connected');
    };
    const onDisconnect = () => isMounted && setStatus('disconnected');
    const onConnectError = () => isMounted && setStatus('connecting');
    const onScoresUpdated = (data: { scores: ProtocolScore[] }) => isMounted && setScores(data.scores);
    const onSignalEvent = (event: SignalEvent) => isMounted && setEvents(prev => [event, ...prev].slice(0, 50));

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('scores_updated', onScoresUpdated);
    socket.on('signal_event', onSignalEvent);

    return () => {
      isMounted = false;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('scores_updated', onScoresUpdated);
      socket.off('signal_event', onSignalEvent);
    };
  }, []);

  return { scores, events, status };
}

'use client';

import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AuthUser {
  id: number;
  telegram_id: string;
  telegram_username: string | null;
  telegram_first_name: string;
  telegram_last_name: string | null;
  telegram_photo_url: string | null;
  auto_trade_enabled: boolean;
  auto_trade_max_pct: number;
  risk_tolerance: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for token in URL params (redirect from Telegram login) or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      localStorage.setItem('argus_token', urlToken);
      setToken(urlToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const stored = localStorage.getItem('argus_token');
      if (stored) setToken(stored);
      else setLoading(false);
    }
  }, []);

  // Fetch user info when token is available
  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Auth failed');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('argus_token');
        setToken(null);
        setUser(null);
        setLoading(false);
      });
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem('argus_token');
    setToken(null);
    setUser(null);
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    const t = token || localStorage.getItem('argus_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (t) headers['Authorization'] = `Bearer ${t}`;
    return headers;
  }, [token]);

  return { user, token, loading, logout, authHeaders, isAuthenticated: !!user };
}

'use client';

import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Wallet {
  id: number;
  user_id: number;
  asset: string;
  balance: number;
  balance_usd: number;
  updated_at: number;
}

export interface Position {
  id: number;
  protocol_id: string;
  protocol_name: string;
  token_id: string;
  pair_id: string;
  chain: string;
  from_asset: string;
  from_amount: number;
  from_amount_usd: number;
  to_asset: string;
  to_amount: number;
  entry_price_usd: number;
  trigger_type: string;
  trigger_description: string;
  agent_suggested: number;
  status: string;
  current_price_usd: number | null;
  pnl_usd: number;
  pnl_pct: number;
  opened_at: number;
}

export interface PortfolioSnapshot {
  total_value_usd: number;
  total_pnl_usd: number;
  total_pnl_pct: number;
  snapshotted_at: number;
}

export interface PortfolioData {
  wallets: Wallet[];
  open_positions: Position[];
  total_value_usd: number;
  total_pnl_usd: number;
  total_pnl_pct: number;
  snapshots: PortfolioSnapshot[];
}

export function usePortfolio(authHeaders: () => Record<string, string>) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/portfolio`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch portfolio');
      const data = await res.json();
      setPortfolio(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // Poll every 15s
  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 15000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const fundWallet = useCallback(async (asset: string, amount: number) => {
    const res = await fetch(`${API_URL}/api/wallet/fund`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ asset, amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fund wallet');
    }
    const data = await res.json();
    await fetchPortfolio(); // Refresh
    return data;
  }, [authHeaders, fetchPortfolio]);

  const closePosition = useCallback(async (positionId: number) => {
    const res = await fetch(`${API_URL}/api/positions/${positionId}/close`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to close position');
    }
    const data = await res.json();
    await fetchPortfolio(); // Refresh
    return data;
  }, [authHeaders, fetchPortfolio]);

  return { portfolio, loading, error, fetchPortfolio, fundWallet, closePosition };
}

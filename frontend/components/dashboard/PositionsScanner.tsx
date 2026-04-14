'use client';

import React, { useState } from 'react';
import { Search, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import { AlertBadge } from '@/components/ui/AlertBadge';

// Matches the backend structure from /api/wallet/:address/exposure
interface Holding {
  tokenAddress: string;
  symbol: string;
  balance: number;
  valueUsd: number;
  isMonitored: boolean;
  risk: { score: number; alertLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'; protocolName: string } | null;
}

export const PositionsScanner = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ totalValueUsd: number; atRiskValueUsd: number; holdings: Holding[] } | null>(null);
  const [error, setError] = useState('');

  const scanWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.startsWith('0x') || address.length < 40) {
      setError('Invalid wallet address');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/wallet/${address}/exposure`);
      const body = await res.json();
      
      if (res.ok) {
        setData(body);
      } else {
        setError(body.error || 'Failed to scan wallet');
      }
    } catch (err) {
      setError('Network error connecting to ARGUS backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
      
      {/* Search Header */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">My Positions & Exposure</h2>
        <p className="text-secondary text-sm mb-6">Scan your wallet against ARGUS real-time risk intelligence.</p>
        
        <form onSubmit={scanWallet} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input 
              type="text" 
              placeholder="Enter EVM wallet address (0x...)"
              className="w-full bg-elevated border border-border rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-argus focus:ring-1 focus:ring-argus font-mono transition-all"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="bg-argus hover:bg-argus-light text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"/> : 'Scan Wallet'}
          </button>
        </form>
        {error && <p className="text-red-400 text-sm mt-3 font-mono">{error}</p>}
      </div>

      {/* Results */}
      {data && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5">
              <span className="text-muted text-xs font-mono uppercase tracking-widest">Total Value Scanned</span>
              <div className="text-3xl font-bold text-white mt-2">${data.totalValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div className={`bg-surface border rounded-xl p-5 ${data.atRiskValueUsd > 0 ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.08)]' : 'border-border'}`}>
              <div className="flex justify-between items-start">
                <span className="text-muted text-xs font-mono uppercase tracking-widest">Value at Risk (Score >45)</span>
                {data.atRiskValueUsd > 0 ? <AlertCircle className="text-red-500" size={20} /> : <Shield className="text-emerald-500" size={20} />}
              </div>
              <div className={`text-3xl font-bold mt-2 ${data.atRiskValueUsd > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                ${data.atRiskValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Holdings List */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 bg-elevated hidden md:flex items-center text-xs font-mono text-muted uppercase tracking-wider">
              <div className="w-[30%]">Asset</div>
              <div className="w-[20%] text-right">Balance</div>
              <div className="w-[20%] text-right">Value (USD)</div>
              <div className="w-[30%] pl-8">ARGUS Risk Assessment</div>
            </div>
            <div className="divide-y divide-border/50">
              {data.holdings.map((token, i) => (
                <div key={i} className="px-6 py-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-elevated/30 transition-colors">
                  <div className="w-[30%]">
                    <div className="font-bold text-white text-lg">{token.symbol}</div>
                    <div className="text-muted font-mono text-[10px] truncate">{token.tokenAddress}</div>
                  </div>
                  <div className="w-[20%] text-left md:text-right font-mono text-secondary">
                    {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </div>
                  <div className="w-[20%] text-left md:text-right font-mono font-bold text-white">
                    ${token.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className="w-[30%] md:pl-8 flex items-center justify-between">
                    {token.isMonitored && token.risk ? (
                      <>
                        <div className="flex flex-col">
                           <span className="text-xs text-secondary mb-1">{token.risk.protocolName}</span>
                           <AlertBadge level={token.risk.alertLevel} />
                        </div>
                        {token.risk.score >= 46 && (
                          <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                             Auto-Protect
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-muted text-xs font-mono">Not actively monitored</span>
                    )}
                  </div>
                </div>
              ))}
              {data.holdings.length === 0 && (
                <div className="p-8 text-center text-secondary">No assets found for this wallet on selected chain.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

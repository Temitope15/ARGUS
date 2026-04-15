'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ASSETS = ['BTC', 'ETH', 'SOL', 'BNB', 'USDT'] as const;
const PRICES: Record<string, number> = {
  BTC: 65000,
  ETH: 3200,
  SOL: 150,
  BNB: 600,
  USDT: 1.0
};

interface FundWalletModalProps {
  onClose: () => void;
  onFund: (asset: string, amount: number) => Promise<void>;
}

export function FundWalletModal({ onClose, onFund }: FundWalletModalProps) {
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const usdValue = numAmount * (PRICES[selectedAsset] || 0);

  const handleFund = async () => {
    if (numAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onFund(selectedAsset, numAmount);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 border border-border/40 max-w-md w-full animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Fund Your Simulated Portfolio</h2>
          <button onClick={onClose} className="text-secondary hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Asset Selector */}
        <div className="mb-6">
          <label className="text-sm text-secondary mb-2 block">Asset</label>
          <div className="flex gap-2">
            {ASSETS.map(asset => (
              <button
                key={asset}
                onClick={() => setSelectedAsset(asset)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-all ${
                  selectedAsset === asset
                    ? 'bg-argus text-white'
                    : 'bg-elevated border border-border/30 text-secondary hover:text-white hover:border-argus/30'
                }`}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="text-sm text-secondary mb-2 block">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`0.00`}
              step="any"
              min="0"
              className="w-full bg-elevated border border-border/40 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-argus/50 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary font-mono text-sm">
              {selectedAsset}
            </span>
          </div>
        </div>

        {/* USD Value */}
        <div className="bg-elevated rounded-xl p-4 mb-6 border border-border/20">
          <div className="flex justify-between text-sm">
            <span className="text-secondary">USD Value</span>
            <span className="text-white font-mono font-bold">≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-secondary">Current Price</span>
            <span className="text-secondary font-mono">${PRICES[selectedAsset]?.toLocaleString()} / {selectedAsset}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Fund Button */}
        <button
          onClick={handleFund}
          disabled={loading || numAmount <= 0}
          className="w-full bg-argus hover:bg-argus-dim disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors text-lg"
        >
          {loading ? 'Funding...' : 'Fund Wallet'}
        </button>

        {/* Disclaimer */}
        <div className="flex items-center gap-2 mt-4 text-xs text-secondary">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>This is a simulated portfolio. No real funds are moved.</span>
        </div>
      </div>
    </div>
  );
}

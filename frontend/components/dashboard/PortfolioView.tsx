'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Wallet, TrendingUp, TrendingDown, DollarSign, Plus, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio, Wallet as WalletType, Position } from '@/hooks/usePortfolio';
import { FundWalletModal } from './FundWalletModal';
import { PositionCard } from './PositionCard';
import { PnLChart } from './PnLChart';

export function PortfolioView() {
  const { user, authHeaders, isAuthenticated } = useAuth();
  const { portfolio, loading, fundWallet, closePosition } = usePortfolio(authHeaders);
  const [showFundModal, setShowFundModal] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="glass-card rounded-2xl p-12 text-center max-w-md">
          <Shield className="w-16 h-16 text-argus mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Sign in to Start Trading</h2>
          <p className="text-secondary mb-6">Connect your Telegram to access your simulated DeFi portfolio.</p>
          <a href="/login" className="inline-block bg-argus hover:bg-argus-dim text-white font-bold py-3 px-8 rounded-xl transition-colors">
            Sign in with Telegram
          </a>
        </div>
      </div>
    );
  }

  if (loading || !portfolio) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-secondary">Loading portfolio...</div>
      </div>
    );
  }

  const pnlPositive = portfolio.total_pnl_usd >= 0;
  const pnlColor = pnlPositive ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
      {/* Simulated Badge */}
      <div className="flex items-center gap-2 text-xs text-secondary">
        <span className="bg-argus/10 text-argus border border-argus/20 px-3 py-1 rounded-full font-mono">
          📋 Simulated Portfolio
        </span>
        <span>Welcome, {user?.telegram_first_name}</span>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Value */}
        <div className="glass-card rounded-2xl p-6 border border-border/40">
          <div className="flex items-center gap-2 text-secondary text-sm mb-2">
            <DollarSign className="w-4 h-4" />
            Total Portfolio Value
          </div>
          <div className="text-3xl font-bold text-white font-mono">
            ${portfolio.total_value_usd.toFixed(2)}
          </div>
        </div>

        {/* Total P&L */}
        <div className="glass-card rounded-2xl p-6 border border-border/40">
          <div className="flex items-center gap-2 text-secondary text-sm mb-2">
            {pnlPositive ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
            Total P&L
          </div>
          <div className={`text-3xl font-bold font-mono ${pnlColor}`}>
            {pnlPositive ? '+' : ''}${portfolio.total_pnl_usd.toFixed(2)}
          </div>
          <div className={`text-sm ${pnlColor} font-mono`}>
            {pnlPositive ? '+' : ''}{portfolio.total_pnl_pct.toFixed(1)}%
          </div>
        </div>

        {/* Open Positions */}
        <div className="glass-card rounded-2xl p-6 border border-border/40">
          <div className="flex items-center gap-2 text-secondary text-sm mb-2">
            <Shield className="w-4 h-4 text-argus" />
            Open Positions
          </div>
          <div className="text-3xl font-bold text-white font-mono">
            {portfolio.open_positions.length}
          </div>
        </div>
      </div>

      {/* Wallet Balances */}
      <div className="glass-card rounded-2xl p-6 border border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-argus" />
            Wallet Balances
          </h3>
          <button
            onClick={() => setShowFundModal(true)}
            className="flex items-center gap-2 bg-argus hover:bg-argus-dim text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Fund Wallet
          </button>
        </div>

        {portfolio.wallets.length === 0 ? (
          <p className="text-secondary text-sm">No funds yet. Click "Fund Wallet" to add virtual assets.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {portfolio.wallets.map((w: WalletType) => (
              <div key={w.asset} className="bg-elevated rounded-xl p-4 border border-border/30">
                <div className="text-xs text-secondary mb-1">{w.asset}</div>
                <div className="text-lg font-bold text-white font-mono">{w.balance.toFixed(6)}</div>
                <div className="text-xs text-secondary font-mono">≈ ${w.balance_usd.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* P&L Chart */}
      {portfolio.snapshots.length > 1 && (
        <div className="glass-card rounded-2xl p-6 border border-border/40">
          <h3 className="text-lg font-bold text-white mb-4">Portfolio Performance</h3>
          <PnLChart snapshots={portfolio.snapshots} />
        </div>
      )}

      {/* Open Positions */}
      {portfolio.open_positions.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-border/40">
          <h3 className="text-lg font-bold text-white mb-4">Open Positions</h3>
          <div className="space-y-3">
            {portfolio.open_positions.map((p: Position) => (
              <PositionCard key={p.id} position={p} onClose={() => closePosition(p.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Fund Wallet Modal */}
      {showFundModal && (
        <FundWalletModal
          onClose={() => setShowFundModal(false)}
          onFund={async (asset, amount) => {
            await fundWallet(asset, amount);
            setShowFundModal(false);
          }}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Clock, X } from 'lucide-react';
import { Position } from '@/hooks/usePortfolio';

interface PositionCardProps {
  position: Position;
  onClose: () => void;
}

export function PositionCard({ position, onClose }: PositionCardProps) {
  const [closing, setClosing] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const pnlPositive = position.pnl_usd >= 0;
  const pnlColor = pnlPositive ? 'text-emerald-400' : 'text-red-400';
  const pnlBg = pnlPositive ? 'bg-emerald-400/10 border-emerald-400/20' : 'bg-red-400/10 border-red-400/20';
  const pnlSign = pnlPositive ? '+' : '';

  // Age
  const ageMs = Date.now() - position.opened_at * 1000;
  const ageHours = Math.floor(ageMs / 3600000);
  const ageMinutes = Math.floor((ageMs % 3600000) / 60000);
  const ageStr = ageHours > 0 ? `${ageHours}h ${ageMinutes}m` : `${ageMinutes}m`;

  // DEX Screener URL
  const pairAddress = position.pair_id.split('-')[0];
  const chartUrl = `https://dexscreener.com/${position.chain}/${pairAddress}?embed=1&theme=dark&info=0`;

  const handleClose = async () => {
    setClosing(true);
    try {
      await onClose();
    } catch {
      setClosing(false);
    }
  };

  return (
    <div className="bg-elevated rounded-xl border border-border/30 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-white font-bold">{position.protocol_name}</div>
              <div className="text-xs text-secondary">{position.to_asset} • {position.chain.toUpperCase()}</div>
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${pnlBg} ${pnlColor}`}>
            {pnlSign}${position.pnl_usd.toFixed(2)} ({pnlSign}{position.pnl_pct.toFixed(1)}%)
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-xs mb-3">
          <div>
            <div className="text-secondary">Entry Price</div>
            <div className="text-white font-mono">${position.entry_price_usd.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-secondary">Current Price</div>
            <div className="text-white font-mono">${(position.current_price_usd || position.entry_price_usd).toFixed(4)}</div>
          </div>
          <div>
            <div className="text-secondary">Tokens</div>
            <div className="text-white font-mono">{position.to_amount.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-secondary flex items-center gap-1"><Clock className="w-3 h-3" /> Age</div>
            <div className="text-white font-mono">{ageStr}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex-1 bg-surface border border-border/40 text-secondary hover:text-white hover:border-argus/30 text-xs font-bold py-2 px-3 rounded-lg transition-colors"
          >
            📊 {showChart ? 'Hide' : 'Show'} Chart
          </button>
          <button
            onClick={handleClose}
            disabled={closing}
            className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {closing ? 'Closing...' : '🏃 Close Position'}
          </button>
        </div>
      </div>

      {/* Embedded DEX Screener Chart */}
      {showChart && (
        <div className="border-t border-border/30">
          <iframe
            src={chartUrl}
            className="w-full border-none"
            style={{ height: '400px' }}
            title={`Chart for ${position.protocol_name}`}
          />
        </div>
      )}
    </div>
  );
}

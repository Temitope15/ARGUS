'use client';

import React from 'react';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://argus-backend-tkgz.onrender.com';
  const botUsername = 'Argus_shield_bot';
  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;

  return (
    <div className="flex flex-col min-h-screen bg-void">
      {/* Background Glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-argus/5 blur-[200px] -z-10" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-argus/5 blur-[150px] -z-10" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] radial-aura -z-10" />

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <a href="/" className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-argus" />
          <span className="text-xl font-bold text-white font-mono">ARGUS</span>
        </a>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="glass-card rounded-3xl p-12 text-center max-w-lg w-full border border-border/40 animate-fade-up">
          {/* Shield Icon */}
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 bg-argus/20 rounded-full blur-xl animate-pulse-ring" />
            <div className="relative w-24 h-24 rounded-full bg-surface border-2 border-argus/30 flex items-center justify-center">
              <Shield className="w-12 h-12 text-argus" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            Sign in to <span className="gradient-text">ARGUS</span>
          </h1>
          
          <p className="text-secondary text-lg mb-8 leading-relaxed">
            Connect with Telegram to start your simulated DeFi portfolio. 
            One click — no email, no password.
          </p>

          {/* Telegram Login Button */}
          <div className="mb-8">
            <a
              href={`https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : backendUrl)}&request_access=write&return_to=${encodeURIComponent(backendUrl + '/auth/telegram/callback')}`}
              className="inline-flex items-center gap-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold py-4 px-8 rounded-2xl transition-all text-lg shadow-lg shadow-[#2AABEE]/20 hover:shadow-[#2AABEE]/40 hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635z"/>
              </svg>
              Sign in with Telegram
            </a>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="text-xs text-secondary">
              <div className="text-lg mb-1">🤖</div>
              <div>AI trade suggestions via Telegram</div>
            </div>
            <div className="text-xs text-secondary">
              <div className="text-lg mb-1">📊</div>
              <div>Live P&L dashboard with charts</div>
            </div>
            <div className="text-xs text-secondary">
              <div className="text-lg mb-1">🐋</div>
              <div>Whale movement alerts</div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 pt-6 border-t border-border/30 text-xs text-muted">
            📋 Simulated Portfolio — No real funds are ever moved
          </div>
        </div>
      </main>
    </div>
  );
}

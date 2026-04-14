'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlowButton } from '@/components/ui/GlowButton';

export const Nav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 flex items-center justify-between px-6 md:px-12 ${
      scrolled ? 'bg-void/80 backdrop-blur-xl border-b border-border' : 'bg-transparent'
    }`}>
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="#FF6B2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="3" fill="#FF6B2B" className="group-hover:scale-110 transition-transform"/>
        </svg>
        <span className="font-mono font-bold text-white text-lg tracking-tight">ARGUS</span>
      </Link>

      {/* Right: Links */}
      <div className="flex items-center gap-8">
        <Link href="#how-it-works" className="hidden md:block text-sm text-secondary hover:text-white transition-colors">
          How it works
        </Link>
        <GlowButton href="/dashboard" size="sm">
          Enter War Room →
        </GlowButton>
      </div>
    </nav>
  );
};

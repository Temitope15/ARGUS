'use client';

import React from 'react';
import Link from 'next/link';

interface GlowButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GlowButton({ children, href, onClick, className = '', size = 'md' }: GlowButtonProps) {
  const baseStyles = "relative overflow-hidden font-bold transition-all duration-300 rounded-xl bg-argus text-white hover:shadow-[0_0_30px_rgba(255,107,43,0.4)] hover:scale-[1.02] active:scale-[0.98]";
  
  const sizeStyles = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-10 py-4 text-lg"
  };

  const shimmerEffect = (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-white/20 -translate-x-full skew-x-[-15deg] group-hover:animate-[shimmer_0.8s_ease-out_forwards]" />
    </div>
  );

  const content = (
    <div className="flex items-center justify-center gap-2">
      {children}
    </div>
  );

  if (href) {
    return (
      <Link 
        href={href} 
        className={`${baseStyles} ${sizeStyles[size]} ${className} group`}
      >
        {shimmerEffect}
        {content}
      </Link>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${className} group`}
    >
      {shimmerEffect}
      {content}
    </button>
  );
}

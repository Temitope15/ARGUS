/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#05080C',
        surface: '#0A0E14',
        elevated: '#111720',
        border: '#1C2333',
        argus: '#FF6B2B',
        'argus-dim': '#C2440A',
        primary: '#EDF2F7',
        secondary: '#7A8898',
        muted: '#3D4B5C',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float': 'float-up 4s ease-in-out infinite',
        'float-slow': 'float-up 6s ease-in-out infinite',
        'float-delay': 'float-up 4s ease-in-out 2s infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'gradient': 'gradient-shift 4s ease infinite',
        'orbit': 'orbit 20s linear infinite',
        'orbit-slow': 'orbit 35s linear infinite',
        'orbit-reverse': 'orbit-reverse 25s linear infinite',
        'scan': 'scan-line 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'slide-left': 'slide-in-left 0.5s ease-out forwards',
        'slide-right': 'slide-in-right 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'cursor': 'blink-cursor 1s step-end infinite',
      },
      keyframes: {
        'float-up': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        orbit: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'orbit-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(500%)', opacity: '0' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'blink-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

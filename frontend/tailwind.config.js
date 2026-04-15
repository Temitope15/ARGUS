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
        void: '#080B0F',
        base: '#080B0F',
        surface: '#0E1318',
        elevated: '#141B22',
        border: '#1E2A35',
        'border-bright': '#2A3A4A',
        primary: '#F0F4F8',
        secondary: '#8A9BB0',
        muted: '#4A5A6A',
        green: '#00D084',
        yellow: '#F5C542',
        orange: '#FF7A2F',
        red: '#FF3B5C',
        accent: '#FF7A2F',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        syne: ['Syne', 'sans-serif'],
      },
      animation: {
        'pulse-danger': 'pulse-danger 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
      },
      keyframes: {
        'pulse-danger': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: .8, transform: 'scale(1.05)' },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};

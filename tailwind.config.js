/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        mono: ['DM Mono', 'Courier New', 'monospace'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        booth: {
          bg: '#0a0a0a',
          panel: '#111111',
          border: '#1e1e1e',
          accent: '#ff3c3c',
          amber: '#ffb800',
          glow: '#ff3c3c',
          dim: '#333333',
          text: '#e8e0d0',
          muted: '#666666',
        },
      },
      animation: {
        flash: 'flash 0.4s ease-out',
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
        'count-pop': 'countPop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'strip-in': 'stripIn 0.5s cubic-bezier(0.16,1,0.3,1)',
        scanline: 'scanline 8s linear infinite',
      },
      keyframes: {
        flash: {
          '0%': { opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        countPop: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        stripIn: {
          '0%': { transform: 'translateX(120%) rotate(2deg)', opacity: '0' },
          '100%': { transform: 'translateX(0) rotate(0deg)', opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}

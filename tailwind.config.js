/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      animation: {
  'fade-in': 'fadeIn 0.5s ease-out',
  'slide-up': 'slideUp 0.4s ease-out',
  'pulse-slow': 'pulse 3s ease-in-out infinite',

  // NEW
  'modal-pop': 'modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
  'fade-bg': 'fadeInBg 0.2s ease-out forwards',
},

keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },

  slideUp: {
    '0%': { transform: 'translateY(16px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },

  modalPop: {
    '0%': {
      opacity: '0',
      transform: 'scale(0.92) translateY(8px)',
    },
    '100%': {
      opacity: '1',
      transform: 'scale(1) translateY(0)',
    },
  },

  fadeInBg: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
},
  plugins: [
  ],
}}}

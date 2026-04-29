/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F97316',
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          500: '#F97316',
          600: '#EA6C0A',
          700: '#C2560A',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          50:  '#F5F3FF',
          100: '#EDE9FE',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        accent: {
          DEFAULT: '#10B981',
          50:  '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
      },
      fontFamily: {
        heading: ['"Baloo 2"', 'cursive'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card':       '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.15)',
        'glow-orange':'0 0 20px rgba(249,115,22,0.4)',
        'glow-purple':'0 0 20px rgba(139,92,246,0.4)',
        'glow-green': '0 0 20px rgba(16,185,129,0.4)',
      },
      animation: {
        'pulse-fire': 'pulse-fire 1.5s ease-in-out infinite',
        'slide-up':   'slide-up 0.3s ease-out',
        'fade-in':    'fade-in 0.3s ease-out',
        'float':      'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-fire': {
          '0%,100%': { transform: 'scale(1)',   filter: 'brightness(1)'   },
          '50%':     { transform: 'scale(1.1)', filter: 'brightness(1.3)' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0px)'   },
          '50%':     { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

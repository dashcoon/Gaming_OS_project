import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          2: 'rgb(var(--accent-2) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        'window-open': {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'dock-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-22px)' },
          '50%': { transform: 'translateY(0)' },
          '75%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(6vw, -4vh) scale(1.1)' },
          '66%': { transform: 'translate(-4vw, 5vh) scale(0.95)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'window-open': 'window-open 220ms cubic-bezier(0.2, 0.9, 0.3, 1.2)',
        'dock-bounce': 'dock-bounce 0.9s ease-in-out',
        float: 'float 22s ease-in-out infinite',
        'float-slow': 'float 34s ease-in-out infinite reverse',
        'toast-in': 'toast-in 260ms ease-out',
        'fade-in': 'fade-in 160ms ease-out',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

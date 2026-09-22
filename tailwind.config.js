/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#07080b',
        surface: '#0d0f14',
        raised: '#12151c',
        overlay: '#171b24',
        hairline: 'rgba(255,255,255,0.07)',
        edge: 'rgba(255,255,255,0.12)',
        ink: {
          DEFAULT: '#e9ecf1',
          muted: '#9aa2b1',
          faint: '#6a7182',
        },
        accent: {
          DEFAULT: '#7c8cff',
          soft: 'rgba(124,140,255,0.14)',
          line: 'rgba(124,140,255,0.32)',
        },
        good: { DEFAULT: '#3fcf8e', soft: 'rgba(63,207,142,0.14)' },
        warn: { DEFAULT: '#f0b429', soft: 'rgba(240,180,41,0.14)' },
        risk: { DEFAULT: '#f0616f', soft: 'rgba(240,97,111,0.14)' },
        info: { DEFAULT: '#4cc9f0', soft: 'rgba(76,201,240,0.14)' },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI Variable Text',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Cascadia Code',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -18px rgba(0,0,0,0.9)',
        lift: '0 24px 60px -28px rgba(0,0,0,0.95)',
        glow: '0 0 0 1px rgba(124,140,255,0.28), 0 18px 48px -24px rgba(124,140,255,0.45)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-14px,0)' },
        },
        sweep: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
        pulseRing: {
          '0%,100%': { opacity: '0.35' },
          '50%': { opacity: '0.85' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.4s ease both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
        drift: 'drift 9s ease-in-out infinite',
        sweep: 'sweep 1.6s ease-in-out infinite',
        'pulse-ring': 'pulseRing 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

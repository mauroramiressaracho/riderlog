import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        asphalt: '#0b111f',
        road: '#151c2e',
        ember: '#f97316',
        flame: '#dc2626',
        gold: '#facc15',
        sand: '#f7f0e8',
      },
      boxShadow: {
        soft: '0 16px 40px rgba(17, 24, 39, 0.12)',
        glow: '0 18px 50px rgba(249, 115, 22, 0.22)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        instrument: {
          space: 'var(--surface-space)',
          text: 'var(--text-primary)',
          accent: 'var(--active-accent)',
        },
        cosmic: {
          950: '#030712',
          900: '#070d1d',
          850: '#0b1329',
          800: '#0d1733',
          700: '#152347',
          600: '#1e3362',
        },
        nasa: {
          blue: '#0B3D91',
          red: '#FC3D21',
          dark: '#050B14',
          card: '#0D1527',
          gold: '#F2A900',
        },
        science: {
          temperature: 'var(--science-temperature)',
          vegetation: 'var(--science-vegetation)',
          ice: 'var(--science-ice)',
          co2: 'var(--science-co2)',
          sea: 'var(--science-sea)',
          accent: 'var(--active-accent)',
        },
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        deep: '24px',
      },
      boxShadow: {
        'glass-edge': '0 0 0 1px rgba(255, 255, 255, 0.08)',
        'glass-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 24px -5px var(--active-accent-soft, rgba(212, 131, 74, 0.2))',
        'cosmic-subtle': '0 4px 20px -2px rgba(3, 7, 18, 0.65)',
      },
      fontFamily: {
        mono: ['var(--font-readout)', 'Cascadia Mono', 'Consolas', 'monospace'],
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-gentle': 'floatGentle 4s ease-in-out infinite',
      },
      keyframes: {
        floatGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
    },
  },
  plugins: [],
}

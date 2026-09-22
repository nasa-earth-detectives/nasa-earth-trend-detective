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
      },
    },
  },
  plugins: [],
}

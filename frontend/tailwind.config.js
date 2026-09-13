/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        farm: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        soil: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#e4d3cd',
          300: '#ceb3a9',
          400: '#b38d7f',
          500: '#9b6e5f',
          600: '#845749',
          700: '#6e4539',
          800: '#5c392f',
          900: '#4e3129',
          950: '#2b1814',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glow-green': '0 0 15px rgba(34, 197, 94, 0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
      },
      backdropBlur: {
        'glass': '8px',
      }
    },
  },
  plugins: [],
}

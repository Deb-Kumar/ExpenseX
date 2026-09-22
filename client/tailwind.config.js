/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        income: {
          light: '#ecfdf5',
          DEFAULT: '#10b981',
          dark: '#047857',
        },
        expense: {
          light: '#fff1f2',
          DEFAULT: '#f43f5e',
          dark: '#be123c',
        },
        dark: {
          bg: '#0a0f1d',
          surface: '#111827',
          card: '#1e293b',
          border: '#334155',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-brand': '0 0 25px -5px rgba(99, 102, 241, 0.4)',
        'glow-income': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'glow-expense': '0 0 25px -5px rgba(244, 63, 94, 0.35)',
      }
    },
  },
  plugins: [],
}

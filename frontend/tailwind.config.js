/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        // Brand accent — indigo/violet.
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
        },
        // Warm neutral scale (slightly violet-tinted grays) — the "approachable" base.
        ink: {
          50: '#faf9fb',
          100: '#f5f3f7',
          200: '#eceaf1',
          300: '#dcd9e3',
          400: '#b8b4c2',
          500: '#918d9c',
          600: '#6c6878',
          700: '#514e5c',
          800: '#343240',
          900: '#1d1b26',
        },
        success: '#16a34a',
        warn: '#d97706',
        danger: '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '22px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(29,27,38,0.04), 0 4px 16px rgba(29,27,38,0.06)',
        pop: '0 10px 34px rgba(29,27,38,0.14)',
        focus: '0 0 0 3px rgba(99,102,241,0.35)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

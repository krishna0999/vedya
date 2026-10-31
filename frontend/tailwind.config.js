/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        // Brand accent — emerald. 50–500 are Tailwind emerald; 600+ are pulled one
        // step darker so `bg-brand-600` (our fill) clears 4.5:1 with white text.
        // True emerald-600 is 3.8:1 and fails AA on a button.
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#047857', // 5.5:1 on white
          700: '#065f46',
          800: '#064e3b',
          900: '#022c22',
        },
        // Secondary accent — cyan. Same darkening at 600+, same reason. For
        // second-series data, informational tints, non-brand emphasis.
        secondary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0e7490', // 5.4:1 on white
          700: '#155e75',
          800: '#164e63',
          900: '#083344',
        },
        // Surface + text scale — slate. Backgrounds, panels, all type.
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // muted-text default — 4.8:1 on white
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Borders and rules ONLY — neutral gray, so edges stay quieter than the
        // cooler slate surfaces they separate. Never use for text or fills.
        line: {
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
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
        // Hairline only: surfaces are defined by borders, not floating shadows.
        card: '0 1px 2px rgba(15,23,42,0.04)',
        pop: '0 10px 34px rgba(15,23,42,0.14)',
        focus: '0 0 0 3px rgba(16,185,129,0.35)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

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
        vault: {
          950: '#070A10',
          900: '#0B111E',
          850: '#0F172A',
          800: '#141E33',
          700: '#1E293B',
          600: '#334155',
          500: '#475569',
        },
        primary: {
          DEFAULT: '#10B981', // emerald
          hover: '#059669',
          glow: 'rgba(16, 185, 129, 0.15)',
        },
        accent: {
          cyan: '#06B6D4',
          purple: '#8B5CF6',
          amber: '#F59E0B',
          crimson: '#EF4444',
          emerald: '#10B981',
        },
        cyber: {
          blue: '#38BDF8',
          teal: '#14B8A6',
          green: '#22C55E',
          yellow: '#EAB308',
          red: '#F43F5E',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}

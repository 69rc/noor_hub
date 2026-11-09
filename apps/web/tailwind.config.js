export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#faf9f4', paper: '#ffffff', ink: '#20382e', muted: '#6c7c72',
        emerald: { 50: '#eff7f1', 100: '#e0eee4', 200: '#bed9c8', 300: '#8ebba2', 400: '#5b9779', 500: '#36795a', 600: '#246347', 700: '#174b3a', 800: '#123c30', 900: '#102f27', 950: '#0b211b' },
        sage: { 50: '#f3f6e9', 100: '#e9efcf', 200: '#dce7b5', 300: '#c5d891', 400: '#adc674', 500: '#8da653', 600: '#6e853d', 700: '#566832', 800: '#46542d', 900: '#3d4929' },
        gold: { 50: '#fbf8eb', 100: '#f5edcc', 200: '#ebda99', 300: '#dfc366', 400: '#d3ad42', 500: '#bd922d', 600: '#9f7224', 700: '#805520', 800: '#6b4521', 900: '#5b3a20' },
        clay: { 100: '#f6e3dc', 300: '#e4b3a0', 400: '#d6977e', 500: '#bd775f', 600: '#a65b46' },
        night: '#101d19', 'night-card': '#192b23', 'night-soft': '#22382d'
      },
      fontFamily: { sans: ['Manrope Variable', 'sans-serif'], arabic: ['Amiri', 'serif'] },
      boxShadow: { soft: '0 6px 28px -12px rgb(25 65 43 / 14%)', lift: '0 16px 48px -16px rgb(16 47 39 / 24%)', nav: '0 -8px 36px -16px rgb(16 47 39 / 18%)' },
      borderRadius: { '4xl': '2rem' },
      keyframes: { breathe: { '0%,100%': { opacity: '.55', transform: 'scale(1)' }, '50%': { opacity: '.85', transform: 'scale(1.04)' } }, shimmer: { '100%': { transform: 'translateX(100%)' } } },
      animation: { breathe: 'breathe 8s ease-in-out infinite', shimmer: 'shimmer 1.7s infinite' }
    }
  },
  plugins: []
};
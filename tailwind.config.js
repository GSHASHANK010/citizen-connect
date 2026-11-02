/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
      },
      colors: {
        ink: '#18201b',
        paper: '#f7f5ef',
        moss: '#315c45',
        leaf: '#dce8da',
        saffron: '#f1a33b',
        alert: '#dd5a4e',
      },
      boxShadow: {
        lift: '0 18px 50px rgba(24,32,27,.14)',
        soft: '0 8px 25px rgba(24,32,27,.09)',
      },
    },
  },
  plugins: [],
}

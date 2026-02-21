/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B5E20',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#1B5E20',
          600: '#2E7D32',
          700: '#1B5E20',
          800: '#1B5E20',
          900: '#0D3B0E',
        },
        accent: {
          DEFAULT: '#FFD700',
          50: '#FFFDE7',
          100: '#FFF9C4',
          200: '#FFF59D',
          300: '#FFF176',
          400: '#FFEE58',
          500: '#FFD700',
        },
      },
    },
  },
  plugins: [],
};

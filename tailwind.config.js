/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fdf7ee',
          100: '#f9e4c8',
          300: '#e2b674',
          500: '#b87b3b',
          600: '#9f6530',
          700: '#7d4f26',
        },
        ink: {
          500: '#284157',
          600: '#1e3243',
          700: '#162635',
        },
        page: {
          100: '#fffaf2',
          200: '#f8f1e5',
        },
      },
    },
  },
  plugins: [],
}

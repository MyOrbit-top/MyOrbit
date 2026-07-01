/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'space': {
          DEFAULT: '#0B1020',
          light: '#141a30',
          lighter: '#1c2440',
        },
        'orbit': {
          DEFAULT: '#2D5BFF',
          light: '#4d7aff',
          dark: '#1a3fcc',
        },
        'flare': {
          DEFAULT: '#FF3DFF',
          light: '#ff6aff',
          dark: '#cc1acc',
        },
        'cyan': {
          DEFAULT: '#2DE2E6',
          light: '#5eeef0',
          dark: '#1ab8bc',
        },
        'stardust': {
          DEFAULT: '#E6E8F0',
          dark: '#a0a4b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d3fd1',
        secondary: '#243141',
        accent: '#5fff9b',
        dark: '#0f1c2c',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

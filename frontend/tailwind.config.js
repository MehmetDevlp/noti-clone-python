/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'notion-bg': '#191919',
        'notion-panel': '#202020',
        'notion-border': '#404040',
        'notion-text': '#FFFFFF',
        'notion-muted': '#9B9A97',
        'notion-hover': '#2f2f2f',
      }
    },
  },
  plugins: [],
}
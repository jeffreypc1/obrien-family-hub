/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        fredoka: ['var(--font-fredoka)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      },
      colors: {
        hub: {
          dark: '#050510',
          card: '#0a0a1f',
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dari: { dark: '#0f172a', light: '#38bdf8', bg: '#f8fafc' }
      },
      fontFamily: { sans: ['var(--font-inter)'] }
    },
  },
  plugins: [],
};

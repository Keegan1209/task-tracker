/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#6366F1',
        'brand-muted': 'rgba(99,102,241,0.15)',
        p1: '#E24B4A',
        p2: '#EF9F27',
        p3: '#888780',
        'status-progress': '#1D9E75',
        'status-blocked': '#EF9F27',
        'status-review': '#7F77DD',
        'status-live': '#3B6D11',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

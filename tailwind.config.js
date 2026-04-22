/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark backgrounds
        'bg-base': '#101319',
        'bg-surface': '#161B24',
        'bg-elevated': '#1C2230',
        'bg-hover': '#222A38',
        // Borders
        'border-subtle': '#2A2A2A',
        'border-default': '#333333',
        // Text
        'text-primary': '#F0F0F0',
        'text-secondary': '#A0A0A0',
        'text-muted': '#606060',
        // Zone colours — pastel on dark
        'zone-queue': '#1A2A3A',
        'zone-queue-border': '#2A4A6A',
        'zone-queue-text': '#7EB8E8',
        'zone-progress': '#1A2A1A',
        'zone-progress-border': '#2A4A2A',
        'zone-progress-text': '#7EC87E',
        'zone-done': '#1A2A1A',
        'zone-done-border': '#2A4A2A',
        'zone-done-text': '#7EC87E',
        // Priority
        p1: '#E24B4A',
        'p1-bg': '#2A1515',
        'p1-border': '#4A2020',
        p2: '#D4A843',
        'p2-bg': '#2A2010',
        'p2-border': '#4A3A15',
        p3: '#888780',
        'p3-bg': '#1E1E1E',
        'p3-border': '#333333',
        // Status
        'status-progress': '#5CB85C',
        'status-done': '#5CB85C',
        'status-queue': '#5B9BD5',
      },
      fontFamily: {
        sans: ['Tahoma', 'Verdana', 'Geneva', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

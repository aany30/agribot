/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'green-deep': 'var(--green-deep)',
        'green-mid': 'var(--green-mid)',
        'gold': 'var(--gold)',
        'gold-light': 'var(--gold-light)',
        'cream': 'var(--cream)',
        'cream-dark': 'var(--cream-dark)',
        'text-dark': 'var(--text-dark)',
        'text-muted': 'var(--text-muted)',
        'conflict-warn': 'var(--conflict-warn)',
        'success': 'var(--success)',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}

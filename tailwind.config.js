/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mirror iOS Extensions+Theme.swift exactly
        'tabs-bg':           { DEFAULT: '#EEEEEE', dark: '#0E0E0E' },
        'tabs-card':         { DEFAULT: '#FFFFFF', dark: '#1C1C1E' },
        'tabs-card-2':       { DEFAULT: '#F5F5F5', dark: '#2C2C2E' },
        'tabs-primary':      { DEFAULT: '#17173A', dark: '#F2F2F7' },
        'tabs-secondary':    { DEFAULT: '#8C8C99', dark: '#8E8E93' },
        'tabs-on-primary':   { DEFAULT: '#FFFFFF', dark: '#17173A' },
        'tabs-green':        '#3DBF71',
        'tabs-green-dark':   '#2B9957',
        'tabs-red':          '#ED4242',
      },
      fontFamily: {
        display: ['Georgia', '"Times New Roman"', 'serif'],
        body:    ['"Inter"', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        mono:    ['"SF Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'card':   '24px',
        'sheet':  '28px',
        'btn':    '16px',
        'pill':   '9999px',
      },
      boxShadow: {
        'card':       '0 2px 20px rgba(0,0,0,0.07)',
        'card-dark':  '0 2px 20px rgba(0,0,0,0.40)',
        'green':      '0 4px 20px rgba(61,191,113,0.38)',
        'red':        '0 4px 20px rgba(237,66,66,0.30)',
        'fab':        '0 6px 24px rgba(61,191,113,0.45)',
      },
      screens: {
        'xs': '400px',
      },
    },
  },
  plugins: [],
}

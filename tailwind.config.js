/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        surface: 'var(--bg-surface)',
        border: 'var(--border)',
        primary: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          subtle: 'var(--brand-subtle)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          subtle: 'var(--brand-subtle)',
        },
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          bg: 'var(--danger-bg)',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '8px',
        input: '8px',
        btn: '8px',
        badge: '999px',
        full: '999px',
      },
      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          '"Noto Sans Devanagari"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'var(--font-geist-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
        display: [
          'var(--font-geist-sans)',
          '"Noto Sans Devanagari"',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
      boxShadow: {
        dropdown: '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
        modal: '0 20px 40px 0 rgba(0, 0, 0, 0.16)',
        none: 'none',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};

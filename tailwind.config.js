/** Kashmir Explorer admin · Tailwind config — Kashmiri palette baked in.
 *  Mirrors @kashmir/design-tokens so the admin matches the mobile app.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        kong:       '#E8893A',
        'kong-deep':'#A65420',
        dal:        '#2A5266',
        'dal-deep': '#15303E',
        chinar:     '#B23A2E',
        amber:      '#D97444',
        pashmina:   '#F5EBDC',
        'pashmina-dark': '#3D352A',
        sapphire:   '#1F4788',
        almond:     '#F4C6C0',
        tulip:      '#C72D3D',
        emerald:    '#2D6A4F',
        mustard:    '#C9A227',
        snow:       '#EDF2F5',
        terra:      '#8B4513',
        'ink':      '#1A1612',
        'ink-2':    '#5A4F42',
        'ink-3':    '#8B7E6F',
        'line':     '#E5D9C5',
        'line-strong': '#C9B89C',
      },
      fontFamily: {
        serif: ['Fraunces', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'monospace'],
        quote: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      borderRadius: { 'card': '10px', 'btn': '6px' },
      boxShadow: {
        warm: '0 2px 6px rgba(61,53,42,0.08)',
        'warm-lg': '0 4px 12px rgba(61,53,42,0.10)',
      },
    },
  },
  plugins: [],
};

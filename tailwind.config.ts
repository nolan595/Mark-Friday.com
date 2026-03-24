import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#111118',
        'surface-raised': '#1A1A24',
        border: '#2A2A35',
        'text-primary': '#F0F0F5',
        'text-muted': '#8888A0',
        accent: '#6C63FF',
        'priority-high': '#FF6B6B',
        'priority-med': '#FFB347',
        'priority-low': '#4ECDC4',
        completed: '#52C788',
        danger: '#FF4D4D',
        'drag-active': '#1A1A28',
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      keyframes: {
        'voice-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'ripple': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'task-enter': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'saved-flash': {
          '0%': { opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'checkmark-draw': {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'voice-pulse': 'voice-pulse 2s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out forwards',
        'task-enter': 'task-enter 0.3s ease-out forwards',
        'saved-flash': 'saved-flash 1.5s ease-in-out forwards',
        'checkmark-draw': 'checkmark-draw 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config

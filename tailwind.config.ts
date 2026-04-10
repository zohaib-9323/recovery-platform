import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      screens: {
        smallScreen: '500px',
      },
      colors: {
        'rp-heading': '#000000',
        'rp-fg': '#333333',
        'rp-muted': '#666666',
        'rp-description': '#333333',
        'rp-disabled': '#CCCCCC',
        'rp-border': '#F2F2F2',
        'rp-page': '#FFFFFF',
        'rp-bg': '#FFFFFF',
        'rp-surface': '#F9F9F9',
        'rp-input': '#F9F9F9',
        'rp-accent': '#E3A602',
        'rp-accent-dark': '#c48f00',
        'rp-icon': '#E3A602',
        'rp-success': '#22c55e',
        primary: 'var(--primary-color, #E3A602)',
        secondary: 'var(--secondary-color, #FFC221)',
        yellow: 'var(--primary-color, #E3A602)',
        bgColor: '#F9F9F9',
        bottomBorder: '#F2F2F2',
        blackFive: '#333333',
        black: '#000000',
        lightYellowThree: '#FCF6E6',
        humburgerIcon: '#CCCCCC',
        redOne: '#DC2626',
      },
      fontFamily: {
        sans: [
          'Montserrat',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
        ],
        lexend: ['Lexend', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        large: '18px',
        xxtiny: '10px',
      },
    },
  },
  plugins: [],
}

export default config

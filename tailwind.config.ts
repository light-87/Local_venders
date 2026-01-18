import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF4F1',
          100: '#FAE5DE',
          200: '#F5C9BC',
          300: '#EDA390',
          400: '#E27D64',
          500: '#D97757',
          600: '#C4684A',
          700: '#A3533B',
          800: '#854432',
          900: '#6E392A',
        },
        surface: {
          primary: '#FAF9F7',
          secondary: '#F5F4F2',
          white: '#FFFFFF',
        },
        ledger: {
          paper: '#FDFCF0',
          charcoal: '#1A1A1A',
          border: '#E8E6D1',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-eb-garamond)', 'EB Garamond', 'serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        md: '0 4px 6px rgba(0, 0, 0, 0.05)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.08)',
        'ledger': '0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;

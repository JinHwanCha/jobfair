import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFFFF0',
          100: '#FEFFC9',
          200: '#FDFF9A',
          300: '#FBFF6B',
          400: '#F9FF00',
          500: '#FFFF00',
          600: '#E6E600',
          700: '#B3B300',
          800: '#808000',
          900: '#4D4D00',
        },
        warm: {
          50: '#FFFFF5',
          100: '#FFFFE8',
          200: '#FEFFC9',
          300: '#FDFF9A',
          400: '#F9FF00',
          500: '#E6E600',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

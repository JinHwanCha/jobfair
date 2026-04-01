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
          50: '#fef7ed',
          100: '#fdecd4',
          200: '#fad5a8',
          300: '#f6b871',
          400: '#f19038',
          500: '#ee7413',
          600: '#df5a09',
          700: '#b9430a',
          800: '#933510',
          900: '#772e10',
        },
        warm: {
          50: '#fdfaf7',
          100: '#f9f3eb',
          200: '#f3e6d4',
          300: '#ebd3b6',
          400: '#e0bb91',
          500: '#d4a373',
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

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
          50: '#effcf9',
          100: '#c6f7eb',
          200: '#8ef0d7',
          300: '#4de4c0',
          400: '#1dcda6',
          500: '#0eb391',
          600: '#099076',
          700: '#0b7361',
          800: '#0e5b4f',
          900: '#104b42',
        },
        warm: {
          50: '#f0fafb',
          100: '#e0f4f7',
          200: '#c4e9ef',
          300: '#9dd9e4',
          400: '#6ec3d3',
          500: '#4aacbf',
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

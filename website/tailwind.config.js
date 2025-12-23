/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(40, 255, 100)',
          dark: 'rgb(32, 172, 86)',
        },
        secondary: {
          DEFAULT: 'rgb(145, 40, 255)',
        },
        success: 'rgb(40, 200, 100)',
        warning: 'rgb(200, 140, 40)',
        error: 'rgb(240, 39, 76)',
        background: {
          DEFAULT: 'rgb(19, 19, 19)',
          variant: 'rgba(39, 39, 39, 1)',
        },
        text: {
          DEFAULT: 'rgb(255, 255, 255)',
          secondary: 'rgba(255, 255, 255, 0.7)',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}



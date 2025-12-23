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
        primary: 'rgb(40, 255, 100)',
        secondary: 'rgb(145, 40, 255)',
        success: 'rgb(40, 200, 100)',
        warning: 'rgb(200, 140, 40)',
        error: 'rgb(240, 39, 76)',
        surface: 'rgb(32, 172, 86)',
        background: 'rgb(19, 19, 19)',
        backgroundVariant: 'rgba(39, 39, 39, 1)',
        text: 'rgb(255, 255, 255)',
        textSecondary: 'rgba(255, 255, 255, 0.7)',
        textTertiary: 'rgba(255, 40, 255, 0.7)',
        onPrimary: 'rgb(0, 0, 0)',
        onSecondary: 'rgb(0, 0, 0)',
        onBackground: 'rgb(255, 255, 255)',
        onSurface: 'rgb(0, 0, 0)',
        onError: 'rgb(0, 0, 0)',
        placeholder: 'rgba(255, 255, 255, 0.5)',
        inputBackground: 'rgba(0, 0, 0, 5)',
        inputBorder: 'rgba(40, 200, 100, 1)',
        border: 'rgba(40, 200, 100, 0.7)',
        disabled: 'rgba(255, 255, 255, 0.38)',
        backdrop: 'rgba(0, 0, 0, 0.5)',
        gold: '#FFD700',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
        shadow: '#000',
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 9999,
      },
      fontFamily: {
        sans: ['SpaceGrotesk-Regular', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}



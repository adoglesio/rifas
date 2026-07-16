/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B1220',
        surface: '#141C30',
        surface2: '#1C2740',
        border: '#2C3A56',
        cream: '#F1ECE2',
        muted: '#8B96AC',
        gold: '#C9A876',
        goldDim: '#6B5A3D',
        blue: '#4577BC',
        red: '#C1443C',
        green: '#6F9C6B',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

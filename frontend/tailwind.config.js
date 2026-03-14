/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        farm: {
          green: '#1B4332', mid: '#40916C', light: '#52B788',
          pale: '#D8F3DC', gold: '#F59E0B', 'gold-light': '#FDE68A',
          cream: '#FAFAF7', dark: '#0F2D1F', soil: '#92400E',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        hindi: ['Hind', 'sans-serif'],
      },
      keyframes: {
        float:     { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-10px)' } },
        ticker:    { '0%': { transform:'translateX(0)' }, '100%': { transform:'translateX(-50%)' } },
        shimmer:   { '0%': { backgroundPosition:'-200%' }, '100%': { backgroundPosition:'200%' } },
        coinFloat: { '0%': { transform:'translateY(0)', opacity:'1' }, '100%': { transform:'translateY(-80px)', opacity:'0' } },
        fadeUp:    { '0%': { opacity:'0', transform:'translateY(30px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        pingSlot:  { '75%,100%': { transform:'scale(2)', opacity:'0' } },
        drawLine:  { '0%': { strokeDashoffset:'1000' }, '100%': { strokeDashoffset:'0' } },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        ticker: 'ticker 25s linear infinite',
        shimmer: 'shimmer 2s linear',
        coinFloat: 'coinFloat 2s ease-out infinite',
        fadeUp: 'fadeUp 0.6s ease forwards',
        pingSlot: 'pingSlot 1.5s cubic-bezier(0,0,0.2,1) infinite',
        drawLine: 'drawLine 2s ease forwards',
      },
    }
  },
  plugins: [],
}

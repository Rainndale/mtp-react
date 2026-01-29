/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      animation: {
          'fade-in': 'fadeIn 0.5s ease-out forwards',
          'slide-up': 'slideUp 0.4s ease-out forwards',
          'glow': 'glow 2s infinite alternate',
          'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
          fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
          slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
          glow: { '0%': { boxShadow: '0 0 5px rgba(79, 70, 229, 0.2)' }, '100%': { boxShadow: '0 0 20px rgba(79, 70, 229, 0.4)' } },
          float: {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-15px)' },
          }
      }
    },
  },
  plugins: [],
}

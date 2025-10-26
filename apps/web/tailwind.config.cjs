/**** @type {import('tailwindcss').Config} ****/
module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      colors: {
        main: '#e86b7f',
        brandFrom: '#e86b7f',
        brandTo: '#ff9eb0',
        borderMuted: 'rgba(17,24,39,0.08)'
      },
      borderRadius: {
        pill: '9999px',
      },
      boxShadow: {
        brand: '0 6px 20px -6px rgba(232,107,127,0.35)',
        brandHover: '0 10px 28px -10px rgba(232,107,127,0.55)'
      },
      letterSpacing: {
        tighter: '-0.02em',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)'
      },
      transitionDuration: {
        250: '250ms'
      }
    },
  },
  plugins: [],
};

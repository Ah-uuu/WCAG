/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        pixel: {
          bg:      '#0a0a0f',
          panel:   '#12121c',
          border:  '#2a2a4a',
          green:   '#00ff41',
          cyan:    '#00e5ff',
          yellow:  '#ffd700',
          red:     '#ff4444',
          purple:  '#b14aff',
          white:   '#e8e8f0',
          gray:    '#6b6b8a',
          dark:    '#05050a',
        },
      },
      boxShadow: {
        pixel:       '4px 4px 0px #000',
        'pixel-sm':  '2px 2px 0px #000',
        'pixel-lg':  '6px 6px 0px #000',
        'pixel-glow-green':  '0 0 10px #00ff41, 0 0 20px #00ff4155',
        'pixel-glow-cyan':   '0 0 10px #00e5ff, 0 0 20px #00e5ff55',
        'pixel-glow-yellow': '0 0 10px #ffd700, 0 0 20px #ffd70055',
        'pixel-glow-purple': '0 0 10px #b14aff, 0 0 20px #b14aff55',
      },
      animation: {
        blink:    'blink 1s step-end infinite',
        scanline: 'scanline 8s linear infinite',
        shake:    'shake 0.5s ease-in-out',
        float:    'float 3s ease-in-out infinite',
      },
      keyframes: {
        blink:    { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
        scanline: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        shake:    { '0%, 100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-4px)' }, '75%': { transform: 'translateX(4px)' } },
        float:    { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        cascade: {
          bgPrimary: '#1E1E1E',
          bgChrome: '#161616',
          bgSecondary: '#2A1B3D',
          borderPurple: '#4A2574',
          accentPurple: '#7E42C1',
          borderNeutral: '#2D2D2D',
          textPrimary: '#E6E6E6',
          textMuted: '#9E9E9E'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Consolas', 'monospace']
      },
      boxShadow: {
        purpleRing: '0 0 0 2px #4A2574',
        purpleGlow: '0 4px 20px -2px rgba(126, 66, 193, 0.35)'
      }
    }
  },
  plugins: []
};

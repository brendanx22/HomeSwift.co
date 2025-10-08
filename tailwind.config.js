/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Raleway', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          light: '#FF8C5A',
          dark: '#E65A2B',
        },
        secondary: {
          DEFAULT: '#2C3E50',
          light: '#3D5568',
          dark: '#1E2B38',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
  // In v4, these are the default values
  corePlugins: {
    preflight: true,
  },
  // Enable modern features
  future: {
    hoverOnlyWhenSupported: true,
  },
  experimental: {
    optimizeUniversalDefaults: true,
  },
};

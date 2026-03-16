/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: "#0D0C0B",
          50: "#1A1816",
          100: "#201D1A",
          200: "#2E2A25",
          300: "#453F38",
        },
        accent: {
          DEFAULT: "#C8965A",
          light: "#DBA86C",
          dark: "#A67832",
        },
        sage: {
          DEFAULT: "#6B8F71",
          light: "#8AAF8F",
        },
        cream: {
          DEFAULT: "#EDE6DA",
          muted: "#A09888",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Archivo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: "#000000",
          50: "#0a0a0a",
          100: "#111111",
          200: "#1a1a1a",
          300: "#2a2a2a",
        },
        accent: {
          DEFAULT: "#FF3F00",
          light: "#FF6B3D",
          dark: "#CC3200",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Consolas", "Liberation Mono", "Courier New", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        none: "0",
      },
    },
  },
  plugins: [],
};

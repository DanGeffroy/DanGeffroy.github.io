/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8E7",
        ink: "#1A1A2E",
        brutal: {
          pink: "#FF6B9D",
          yellow: "#FFE74C",
          blue: "#4DEEEA",
          green: "#06D6A0",
          orange: "#FF8C42",
          purple: "#C77DFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        brutal: "4px 4px 0 #1A1A2E",
        "brutal-lg": "6px 6px 0 #1A1A2E",
        "brutal-sm": "3px 3px 0 #1A1A2E",
      },
    },
  },
  plugins: [],
};

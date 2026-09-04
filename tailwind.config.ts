import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF6EF",
        cocoa: "#241A12",
        brand: {
          50: "#FFF9ED",
          100: "#FDEFD2",
          200: "#FADB9F",
          300: "#F7C264",
          400: "#F4A93B",
          500: "#EE8F17",
          600: "#D9710B",
          700: "#B45609",
          800: "#92450E",
          900: "#783A0F",
        },
        leaf: {
          50: "#F2F9F1",
          100: "#DFEFD9",
          200: "#C1DFB7",
          300: "#96C788",
          400: "#67A957",
          500: "#468B39",
          600: "#35702B",
          700: "#2B5924",
          800: "#25471F",
          900: "#203C1D",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -6px rgba(36,26,18,0.12)",
        card: "0 2px 12px -2px rgba(36,26,18,0.08)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp .5s ease-out both",
        fadeIn: "fadeIn .4s ease-out both",
        floaty: "floaty 5s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        slideIn: "slideIn .25s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;

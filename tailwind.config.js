/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta tirada da logo e do favicon originais: vinho profundo, creme e dourado.
        wine: {
          950: "rgb(var(--wine-950) / <alpha-value>)",
          900: "rgb(var(--wine-900) / <alpha-value>)",
          800: "rgb(var(--wine-800) / <alpha-value>)",
          700: "rgb(var(--wine-700) / <alpha-value>)",
          600: "rgb(var(--wine-600) / <alpha-value>)",
          100: "rgb(var(--wine-100) / <alpha-value>)",
          50: "rgb(var(--wine-50) / <alpha-value>)",
        },
        ivory: "rgb(var(--ivory) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        sand: "rgb(var(--sand) / <alpha-value>)",
        cream: "rgb(var(--cream) / <alpha-value>)",
        gold: { DEFAULT: "#A1815E", light: "#C9AE8A", dark: "#7D6346" },
        ink: { DEFAULT: "rgb(var(--ink) / <alpha-value>)", soft: "rgb(var(--ink-soft) / <alpha-value>)", muted: "rgb(var(--ink-muted) / <alpha-value>)" },
        surface: "rgb(var(--surface) / <alpha-value>)",
        success: "#2E6B4A",
        warning: "#9A6B12",
        danger: "#A23A3A",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Jost"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      letterSpacing: { brand: "0.32em" },
      borderRadius: { arch: "999px 999px 0 0" },
      boxShadow: {
        soft: "0 1px 2px rgba(34,26,22,.04), 0 8px 24px -12px rgba(34,26,22,.12)",
        lift: "0 2px 4px rgba(34,26,22,.05), 0 18px 40px -18px rgba(34,26,22,.25)",
      },
      transitionTimingFunction: { soft: "cubic-bezier(.22,.61,.36,1)" },
      keyframes: {
        "fade-up": { from: { opacity: 0, transform: "translateY(14px)" }, to: { opacity: 1, transform: "none" } },
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "blur-in": { from: { opacity: 0, filter: "blur(8px)", transform: "translateY(6px)" }, to: { opacity: 1, filter: "blur(0)", transform: "none" } },
        "slow-zoom": { from: { transform: "scale(1.06)" }, to: { transform: "scale(1)" } },
      },
      animation: {
        "fade-up": "fade-up .8s cubic-bezier(.22,.61,.36,1) both",
        "fade-in": "fade-in .6s ease both",
        "blur-in": "blur-in .9s cubic-bezier(.22,.61,.36,1) both",
        "slow-zoom": "slow-zoom 2.4s cubic-bezier(.22,.61,.36,1) both",
      },
    },
  },
  plugins: [],
};

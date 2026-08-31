import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0A08",
          900: "#12100C",
          800: "#1A160F",
          700: "#241E14",
        },
        gold: {
          200: "#EAD9A0",
          300: "#DCC177",
          400: "#C9A227",
          500: "#BB9E49",
          600: "#8C7433",
          700: "#5F5436",
        },
        parchment: {
          100: "#F5F0E4",
          300: "#DCD3BF",
          500: "#A69C87",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(187,158,73,0.18), 0 8px 30px -8px rgba(187,158,73,0.25)",
      },
      backgroundImage: {
        "gold-arc": "radial-gradient(120% 120% at 100% 0%, rgba(187,158,73,0.16) 0%, rgba(187,158,73,0) 60%)",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        scanline: "scanline 1.8s cubic-bezier(0.4,0,0.2,1) infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

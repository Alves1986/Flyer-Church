import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          white: "#FCFCFA",
          cream: "#F7F5F0",
          stone: "#EAE7E0",
          ink: "#0A0A0A",
          gold: {
            100: "#FDF7D8",
            200: "#F3E5B5",
            300: "#EAD9A0",
            400: "#DCC177",
            500: "#B8860B",
            600: "#9A6B08",
            700: "#7A5506",
          },
        },
        // Tema escuro do app (painel, configurações, geração)
        midnight: {
          950: "#0B0A08",
          900: "#12100C",
        },
        ink: {
          950: "#0A0A0A",
          900: "#0B0A08",
        },
        gold: {
          100: "#FDF7D8",
          200: "#F3E5B5",
          300: "#EAD9A0",
          400: "#DCC177",
          500: "#B8860B",
          600: "#9A6B08",
          700: "#7A5506",
        },
        parchment: {
          100: "#F5F0E4",
          200: "#DCD3BF",
          300: "#A69C87",
          400: "#8A7F6B",
          500: "#6B604E",
        },
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          600: "#475569",
          900: "#0F172A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.05)",
        premium: "0 20px 50px -12px rgba(0, 0, 0, 0.12)",
        goldGlow: "0 0 20px rgba(184, 134, 11, 0.2)",
        sharp: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        glow: "0 0 20px rgba(184, 134, 11, 0.15)",
      },
      backgroundImage: {
        "premium-gradient":
          "radial-gradient(circle at top right, rgba(184, 134, 11, 0.08), transparent 40%)",
      },
      animation: {
        "bounce-slow": "bounce 2s infinite ease-in-out",
        "spin-slow": "spin 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

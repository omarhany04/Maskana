import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101522",
        mist: "#F5F7FA",
        graphite: "#1F2937",
        porcelain: "#FBFCFE",
        sea: {
          50: "#EAFBF8",
          100: "#C8F4ED",
          200: "#91E7DB",
          300: "#4DD1C2",
          400: "#20B8AA",
          500: "#119C92",
          600: "#0C7D76",
          700: "#0F635F",
          800: "#104F4D",
          900: "#0D3E3E"
        },
        gold: {
          50: "#FFF9E8",
          100: "#FEEDB8",
          300: "#F4CB58",
          500: "#C89318",
          700: "#7C5610"
        },
        signal: {
          coral: "#D64E45",
          violet: "#6857F5",
          blue: "#2563EB",
          emerald: "#047857",
          steel: "#64748B"
        }
      },
      boxShadow: {
        soft: "0 18px 60px -42px rgba(15, 23, 42, 0.62)",
        lift: "0 24px 72px -40px rgba(15, 23, 42, 0.52)",
        glow: "0 18px 44px -30px rgba(17, 156, 146, 0.82)",
        crisp: "0 1px 2px rgba(15, 23, 42, 0.06), 0 10px 32px -26px rgba(15, 23, 42, 0.38)"
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(135deg, rgba(16,21,34,0.94), rgba(14,62,62,0.82)), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.08) 1px, transparent 1px)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        mist: "#F4F7F8",
        sea: {
          50: "#ECFEF8",
          100: "#C9FCEF",
          200: "#9AF5DF",
          300: "#5BE5C8",
          400: "#20C9AE",
          500: "#13A090",
          600: "#0D7F75",
          700: "#0F655F",
          800: "#11514D",
          900: "#0E3F3D"
        },
        gold: {
          100: "#FFF3C4",
          300: "#F8D766",
          500: "#D6A21F",
          700: "#8A6112"
        },
        signal: {
          coral: "#E15A4F",
          violet: "#6D5DF6",
          blue: "#2563EB",
          emerald: "#059669"
        }
      },
      boxShadow: {
        soft: "0 24px 80px -52px rgba(15, 23, 42, 0.75)",
        lift: "0 28px 72px -44px rgba(13, 24, 38, 0.65)",
        glow: "0 18px 42px -28px rgba(19, 160, 144, 0.9)"
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(135deg, rgba(11,18,32,0.92), rgba(15,81,77,0.82)), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.08) 1px, transparent 1px)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;

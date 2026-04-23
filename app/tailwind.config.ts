import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102A43",
        mist: "#F5F7FA",
        sea: {
          50: "#EFFCFA",
          100: "#C8F3EC",
          200: "#9BE7DC",
          300: "#67D4C9",
          400: "#35B9AF",
          500: "#1E938B",
          600: "#16746F",
          700: "#125D59",
          800: "#114A48",
          900: "#113D3C"
        },
        gold: {
          100: "#FFF1C7",
          300: "#F9D776",
          500: "#D4A72C",
          700: "#9A7415"
        }
      },
      boxShadow: {
        soft: "0 20px 50px -24px rgba(16, 42, 67, 0.35)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top right, rgba(30,147,139,0.18), transparent 35%), radial-gradient(circle at 15% 20%, rgba(212,167,44,0.12), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.92), rgba(245,247,250,0.96))"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;


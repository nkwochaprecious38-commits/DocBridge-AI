import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#142B4A", brand: "#2463EB", teal: "#16A6A1", aqua: "#75D5CF", mist: "#F3F6FA",
      },
      fontFamily: {
        heading: ["Manrope", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(20,43,74,0.06), 0 8px 24px rgba(20,43,74,0.06)" },
    },
  },
  plugins: [],
};
export default config;

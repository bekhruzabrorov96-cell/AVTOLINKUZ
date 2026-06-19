import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151719",
        muted: "#667085",
        line: "#E7EAEE",
        brand: "#0B7A75",
        brandDark: "#075E59",
        accent: "#E84F2A",
        cobalt: "#1D4ED8",
        surface: "#F5F7FA"
      }
    }
  },
  plugins: []
};

export default config;

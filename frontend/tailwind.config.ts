import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          primary: "#0B1F3A",
          accent: "#06B6D4"
        }
      }
    }
  },
  plugins: []
} satisfies Config;


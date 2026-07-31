import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef4ff",
          500: "#3b6ff0",
          900: "#0f1f4d",
        },
        neutral: {
          0: "#ffffff",
          100: "#f5f6f8",
          500: "#6b7280",
          900: "#111318",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

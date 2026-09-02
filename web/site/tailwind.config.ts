import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0284C7", // Sky 600
          hover: "#0369A1",   // Sky 700
          light: "#E0F2FE",   // Sky 100
          dark: "#075985",    // Sky 800
        },
        secondary: {
          DEFAULT: "#0EA5E9", // Sky 500
          hover: "#0284C7",
        },
        accent: {
          DEFAULT: "#38BDF8", // Sky 400
        },
        "background-light": "#F0F9FF", // Sky 50
        "background-subtle": "#E0F2FE", // Sky 100
        "surface": "#FFFFFF",
        "border-sky": "#BAE6FD", // Sky 200
        "text-primary": "#0F172A",
        "text-secondary": "#475569",
      },
      fontFamily: {
        display: ["Public Sans", "sans-serif"],
        sans: ["Public Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        sky: "0 10px 25px -5px rgba(2, 132, 199, 0.1), 0 8px 10px -6px rgba(2, 132, 199, 0.1)",
        "sky-lg": "0 20px 30px -10px rgba(2, 132, 199, 0.15), 0 10px 15px -5px rgba(2, 132, 199, 0.1)",
      },
    },
  },
};

export default config;
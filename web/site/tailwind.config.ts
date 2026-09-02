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
          DEFAULT: "#2563EB", // BluePrimaryLight
          hover: "#1D4ED8",   // Blue 700
          light: "#DCE9FF",   // BluePrimaryContainerLight
          container: "#DCE9FF",
          dark: "#1E40AF",    // Blue 800
        },
        secondary: {
          DEFAULT: "#4F75B9", // BlueSecondaryLight
          hover: "#3B62A4",
          container: "#E6F0FD",
        },
        accent: {
          DEFAULT: "#3B82F6",
          mint: "#10B981",
          peach: "#F97316",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          variant: "#EAF1FB", // BlueSurfaceVariantLight
          dark: "#151E2D",
        },
        "background-light": "#F6F9FF", // BlueBackgroundLight
        "background-subtle": "#EAF1FB",
        outline: {
          DEFAULT: "#A9B8CD",
          variant: "#E2E8F0",
        },
        "border-sky": "#DCE9FF",
        "text-primary": "#172033",
        "text-secondary": "#4A5568",
        "text-muted": "#64748B",
        success: {
          DEFAULT: "#16A34A",
          container: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#D97706",
          container: "#FEF3C7",
        },
        error: {
          DEFAULT: "#DC2626",
          container: "#FFDAD6",
        },
        info: {
          DEFAULT: "#0284C7",
          container: "#E0F2FE",
        },
      },
      fontFamily: {
        display: ["var(--font-inter)", "Inter", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(16, 42, 86, 0.05), 0 1px 2px rgba(16, 42, 86, 0.03)",
        "card-hover": "0 8px 24px -4px rgba(37, 99, 235, 0.08), 0 4px 8px -2px rgba(37, 99, 235, 0.04)",
        button: "0 4px 14px 0 rgba(37, 99, 235, 0.25)",
      },
    },
  },
};

export default config;
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0A0A0F",
        surface: "#111118",
        "surface-2": "#1A1A24",
        border: "#2A2A3A",
        primary: "#6366F1",
        "primary-hover": "#4F46E5",
        accent: "#06B6D4",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        "text-primary": "#F1F5F9",
        "text-secondary": "#94A3B8",
        "text-muted": "#475569",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
}

export default config
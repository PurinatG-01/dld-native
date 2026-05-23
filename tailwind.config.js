/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5",
        "primary-foreground": "#ffffff",
        "primary-light": "#818cf8",
        "primary-lighter": "#a5b4fc",
        background: "#f8fafc",
        card: "#ffffff",
        "card-foreground": "#0f172a",
        border: "#e2e8f0",
        foreground: "#0f172a",
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        success: "#16a34a",
        "success-foreground": "#4ade80",
        "success-muted": "#052e16",
        "error-foreground": "#f87171",
        "error-muted": "#2d0a0a",
      },
    },
  },
  plugins: [],
};

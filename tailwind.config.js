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
        background: "#f8fafc",
        card: "#ffffff",
        "card-foreground": "#0f172a",
        border: "#e2e8f0",
        foreground: "#0f172a",
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
      },
    },
  },
  plugins: [],
};

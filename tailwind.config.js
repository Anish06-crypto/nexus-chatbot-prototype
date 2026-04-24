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
        primary: "#1a2f4a",
        accent: "#e8a020",
        background: "#faf8f5",
        surface: "#ffffff",
        ink: "#1a1a1a",
        secondary: "#6b7280",
      },
    },
  },
  plugins: [],
};

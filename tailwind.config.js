/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
    },
    extend: {
      colors: {
        moss: {
          50: "#E8F1E9",
          100: "#C8E0C9",
          200: "#9CC7A0",
          300: "#66BB6A",
          400: "#43A047",
          500: "#2E7D32",
          600: "#256B29",
          700: "#1B5E20",
          800: "#15461A",
          900: "#0E2F12",
        },
        paper: {
          DEFAULT: "#FAF7F0",
          pure: "#FFFFFF",
          warm: "#F3EEE2",
          edge: "#E7E0CF",
        },
        ink: {
          DEFAULT: "#212121",
          soft: "#6B6B6B",
          faint: "#9A9A9A",
        },
        ember: {
          DEFAULT: "#E65100",
          soft: "#FB8C00",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        book: "0 6px 20px -8px rgba(27, 94, 32, 0.18)",
        "book-hover": "0 18px 38px -12px rgba(27, 94, 32, 0.32)",
        spine: "inset 4px 0 10px -4px rgba(0,0,0,0.35)",
        soft: "0 2px 10px -4px rgba(33,33,33,0.12)",
      },
      borderRadius: {
        bookmark: "10px 10px 2px 2px",
      },
      keyframes: {
        "float-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pulse-node": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(46,125,50,0.5)" },
          "50%": { transform: "scale(1.15)", boxShadow: "0 0 0 8px rgba(46,125,50,0)" },
        },
      },
      animation: {
        "float-up": "float-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.5s ease both",
        "slide-in": "slide-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-node": "pulse-node 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

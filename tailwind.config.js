/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0E14",
          soft: "#12161F",
          raised: "#1A1F2B",
        },
        parchment: {
          DEFAULT: "#F6F3EC",
          dim: "#EDE8DC",
        },
        rose: {
          DEFAULT: "#B5495B",
          light: "#D98A96",
          dark: "#8A3646",
        },
        plum: {
          DEFAULT: "#6E5A86",
          light: "#9A87B3",
        },
        gold: {
          DEFAULT: "#C9A15A",
          light: "#E3C687",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        soft: "1.25rem",
        pill: "999px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.25)",
      },
      keyframes: {
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        heartbeat: "heartbeat 1.1s ease-in-out",
        riseIn: "riseIn 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

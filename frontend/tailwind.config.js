/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#1c1917",
          900: "#292524",
          800: "#44403c"
        },
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(41 37 36 / 0.04), 0 4px 10px -3px rgb(41 37 36 / 0.08)",
        panel: "0 2px 4px 0 rgb(41 37 36 / 0.04), 0 12px 24px -8px rgb(41 37 36 / 0.10)"
      }
    }
  },
  plugins: []
};

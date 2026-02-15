/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tell Tailwind which files to scan for class names
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Custom colors for our trading app
      colors: {
        // "profit" green and "loss" red for trading visuals
        profit: {
          light: "#dcfce7",
          DEFAULT: "#22c55e",
          dark: "#15803d",
        },
        loss: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
          dark: "#b91c1c",
        },
      },
    },
  },
  plugins: [],
};

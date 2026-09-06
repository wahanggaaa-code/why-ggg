/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#060607",
        fg: "#e9e9ea",
        muted: "#9a9a9e",
        line: "#1a1a1e",
      },
      fontFamily: {
        sans: ['"General Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

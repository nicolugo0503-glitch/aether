import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07070a",
        panel: "#0d0d12",
        border: "#1d1d25",
        muted: "#8b8b96",
        accent: "#7c5cff",
        "accent-2": "#22d3ee",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,92,255,0.25), transparent)",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:         "#f4f5f7",
        panel:      "#ffffff",
        border:     "#eaecf0",
        muted:      "#6b7280",
        accent:     "#7c3aed",
        "accent-2": "#0ea5e9",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "JetBrains Mono", "Menlo", "monospace"],
      },
      backgroundImage: {
        "hero-glow":  "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.3), transparent)",
        "hero-glow2": "radial-gradient(ellipse 50% 40% at 80% 60%, rgba(34,211,238,0.08), transparent)",
      },
    },
  },
  plugins: [],
};
export default config;

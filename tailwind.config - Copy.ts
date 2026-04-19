import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:         "#000000",
        panel:      "#0a0a0a",
        border:     "rgba(255,255,255,0.06)",
        muted:      "#71717a",
        accent:     "#7c3aed",
        "accent-2": "#22d3ee",
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

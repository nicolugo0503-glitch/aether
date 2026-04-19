import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:        "#030304",
        surface:   "#080809",
        panel:     "#0e0e10",
        elevated:  "#141416",
        border:    "#1c1c1f",
        "border-bright": "#2a2a2f",
        text:      "#f2f2f4",
        muted:     "#5a5a65",
        "muted-2": "#3a3a42",
        accent:    "#00e87a",   // Electric lime green — COMPLETELY DIFFERENT
        "accent-2":"#00b4ff",  // Electric blue
        "accent-3":"#ff2d55",  // Electric red-pink
        "accent-4":"#ffcc00",  // Electric gold
        success:   "#00e87a",
        warning:   "#ffcc00",
        danger:    "#ff2d55",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display": ["clamp(3rem,8vw,7rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-sm": ["clamp(2rem,5vw,4rem)", { lineHeight: "1", letterSpacing: "-0.025em" }],
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(rgba(0,232,122,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,232,122,0.04) 1px,transparent 1px)",
        "radial-glow-green":
          "radial-gradient(ellipse 80% 60% at 50% 0%,rgba(0,232,122,0.12),transparent 70%)",
        "radial-glow-blue":
          "radial-gradient(ellipse 60% 40% at 80% 30%,rgba(0,180,255,0.08),transparent 60%)",
        "card-shine":
          "linear-gradient(135deg,rgba(0,232,122,0.06) 0%,transparent 50%,rgba(0,232,122,0.02) 100%)",
        "gradient-primary":
          "linear-gradient(135deg,#00e87a 0%,#00b4ff 100%)",
        "gradient-hero":
          "linear-gradient(180deg,transparent 0%,rgba(0,232,122,0.04) 100%)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        "glow":        "0 0 30px rgba(0,232,122,0.20), 0 0 60px rgba(0,232,122,0.06)",
        "glow-sm":     "0 0 15px rgba(0,232,122,0.15)",
        "glow-blue":   "0 0 30px rgba(0,180,255,0.15)",
        "card":        "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.6)",
        "card-hover":  "0 1px 0 rgba(0,232,122,0.1) inset, 0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,232,122,0.2)",
        "button":      "0 2px 8px rgba(0,232,122,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
        "button-hover":"0 4px 20px rgba(0,232,122,0.45), inset 0 1px 0 rgba(255,255,255,0.20)",
        "terminal":    "0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,232,122,0.15)",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;

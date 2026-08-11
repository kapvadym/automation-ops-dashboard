import type { Config } from "tailwindcss";

// Design tokens per the approved plan's "Visual design" section — an
// operations-console identity, not a marketing-SaaS default. Domain colors
// (rag/workflow/agent/keys) are kept semantically separate from status
// colors (healthy/pending/error).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0B0E11",
        panel: "#12161B",
        "panel-raised": "#171C22",
        line: "#232A31",
        ink: "#E7ECEF",
        "ink-dim": "#8A96A3",
        status: {
          healthy: "#4FD1AE",
          pending: "#E8A33D",
          error: "#E2574C",
        },
        domain: {
          rag: "#8B7FD6",
          workflow: "#D9A441",
          agent: "#5EC8D8",
          keys: "#D6706F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        breathe: "breathe 2.2s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

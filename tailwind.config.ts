import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          light: "#F9FAFB", // Slate 50
          dark: "#030712",  // Gray 950
        },
        foreground: {
          light: "#111827", // Gray 900
          dark: "#F9FAFB",  // Gray 50
        },
        brand: {
          purple: "#4F46E5",  // Indigo 605
          orange: "#F97316",  // Amazon Orange
          shopee: "#EE4D2D",  // Shopee Coral
          cyan: "#06B6D4",    // Cyber/AI Cyan
          emerald: "#10B981"  // Safe Green
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        "glass-sm": "0 2px 8px 0 rgba(0, 0, 0, 0.05)",
        "glass-md": "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
        "glass-lg": "0 12px 48px 0 rgba(0, 0, 0, 0.12)",
        "neon-glow": "0 0 20px rgba(79, 70, 229, 0.15)",
        "cyber-glow": "0 0 25px rgba(6, 182, 212, 0.2)"
      },
      backdropBlur: {
        "glass": "12px",
        "glass-lg": "24px"
      },
      animation: {
        "marquee-infinite": "marquee 35s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "aurora": "aurora-bg 20s ease infinite alternate",
        "float": "float-item 6s ease-in-out infinite"
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" }
        },
        "aurora-bg": {
          "0%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
          "100%": { "background-position": "0% 50%" }
        },
        "float-item": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        }
      }
    },
  },
  plugins: [],
};

export default config;

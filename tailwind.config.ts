import type { Config } from "tailwindcss";

const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

const config: Config = {
  // IMPORTANT: every folder that contains Tailwind classes must be listed here,
  // otherwise those classes are silently missing from the CSS.
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: { bg: c("bg"), surface: c("surface"), ink: c("ink"), muted: c("muted"), line: c("line"), sky: c("sky"), blue: c("blue"), emerald: c("emerald"), gold: c("gold") },
      fontFamily: { sans: ["'Manrope Variable'", "system-ui", "sans-serif"], arabic: ["'Noto Naskh Arabic'", "serif"] },
      boxShadow: {
        soft: "0 12px 40px -14px rgb(var(--blue) / 0.35)",
        glow: "0 0 90px -12px rgb(var(--sky) / 0.55)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { float: "float 7s ease-in-out infinite", "fade-up": "fadeUp .8s ease both" },
    },
  },
  plugins: [],
};
export default config;
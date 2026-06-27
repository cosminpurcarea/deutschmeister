import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fiori: {
          blue: "var(--fiori-blue)",
          orange: "var(--fiori-orange)",
          background: "var(--fiori-background)",
          surface: "var(--fiori-surface)",
          border: "var(--fiori-border)",
          text: "var(--fiori-text-primary)",
          muted: "var(--fiori-text-secondary)",
          success: "var(--fiori-success)",
          error: "var(--fiori-error)",
        },
      },
      fontFamily: {
        fiori: ["72", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

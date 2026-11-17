import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F8F4EE",
        "warm-white": "#FDFBF8",
        deep: "#1A1410",
        brown: "#4A3728",
        gold: {
          DEFAULT: "#C9A96E",
          light: "#E8D5B0",
          hover: "#B89658",
        },
        muted: "#8A7A6E",
        line: "rgba(74, 55, 40, 0.12)",
      },
      fontFamily: {
        headline: ["'Anton'", "'Oswald'", "Impact", "Arial Black", "sans-serif"],
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "DM Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      letterSpacing: {
        label: "0.22em",
        tightest: "-0.04em",
      },
      borderRadius: {
        photo: "12px",
        "photo-mobile": "9px",
        card: "4px",
      },
      boxShadow: {
        editorial: "0 10px 30px -10px rgba(26, 20, 16, 0.08)",
        floating: "0 20px 40px -15px rgba(26, 20, 16, 0.15)",
        pill: "0 4px 14px rgba(26, 20, 16, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;

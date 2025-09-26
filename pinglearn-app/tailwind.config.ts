import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          cyan: "#06B6D4",
          "cyan-glow": "rgba(6, 182, 212, 0.5)",
          "cyan-subtle": "rgba(6, 182, 212, 0.1)",
          "cyan-border": "rgba(6, 182, 212, 0.2)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Add custom colors from glass-morphism.css
        black: {
          100: "#000000",
          95: "#0D0D0D",
          90: "#1A1A1A",
          85: "#262626",
        },
        white: {
          100: "rgba(255, 255, 255, 1)",
          85: "rgba(255, 255, 255, 0.85)",
          70: "rgba(255, 255, 255, 0.7)",
          50: "rgba(255, 255, 255, 0.5)",
          30: "rgba(255, 255, 255, 0.3)",
          25: "rgba(255, 255, 255, 0.25)",
          20: "rgba(255, 255, 255, 0.20)",
          15: "rgba(255, 255, 255, 0.15)",
          10: "rgba(255, 255, 255, 0.1)",
          5: "rgba(255, 255, 255, 0.05)",
          3: "rgba(255, 255, 255, 0.03)",
          2: "rgba(255, 255, 255, 0.02)",
          1: "rgba(255, 255, 255, 0.01)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
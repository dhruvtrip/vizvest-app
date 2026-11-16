import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  // Hover styles only where a pointer can hover, so they never stick after a tap.
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      // One family for everything, numerals and code included.
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      lineHeight: {
        relaxed: '1.625',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        'ring-strong': 'hsl(var(--ring-strong))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: 'hsl(var(--warning))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
        },
        amber: 'hsl(var(--amber))',
        tile: {
          DEFAULT: 'hsl(var(--tile))',
          hover: 'hsl(var(--tile-hover))',
        },
        raised: 'hsl(var(--raised))',
        panel: {
          DEFAULT: 'hsl(var(--panel))',
          foreground: 'hsl(var(--panel-foreground))',
        },
        up: 'hsl(var(--up))',
        down: 'hsl(var(--down))',
        chart: {
          1: 'rgb(var(--chart-1) / <alpha-value>)',
          2: 'rgb(var(--chart-2) / <alpha-value>)',
          3: 'rgb(var(--chart-3) / <alpha-value>)',
          4: 'rgb(var(--chart-4) / <alpha-value>)',
          5: 'rgb(var(--chart-5) / <alpha-value>)',
          6: 'rgb(var(--chart-6) / <alpha-value>)',
        },
      },
      // Built from a 10px base. Pills for actions, large soft corners for surfaces.
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: 'var(--radius)',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.375rem',
        '4xl': '1.625rem',
        '5xl': '2.5rem',
      },
      maxWidth: {
        shell: '80rem',
        content: '72rem',
        prose: '44rem',
      },
      spacing: {
        section: '11rem',
      },
      // Named steps, because arbitrary duration-[..] and ease-[..] values are
      // ambiguous between the transition and animation plugins.
      transitionDuration: {
        '250': '250ms',
        '355': '355ms',
        '400': '400ms',
        '600': '600ms',
      },
      transitionTimingFunction: {
        spring: 'var(--ease-spring)',
        ui: 'cubic-bezier(0.4, 0, 0.2, 1)',
        reveal: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'smooth-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
        press: 'cubic-bezier(0, 0, 0.58, 1)',
        glide: 'cubic-bezier(0.42, 0, 0.58, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

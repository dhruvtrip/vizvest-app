import type { Config } from 'tailwindcss'

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`

const config: Config = {
  darkMode: ['class'],
  // hover: variants only apply on devices that can hover
  future: { hoverOnlyWhenSupported: true },
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1088px',
      },
    },
    extend: {
      fontFamily: {
        // One family across the whole product
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Reference scale: size / line-height, tracking, weight
        h1: ['56px', { lineHeight: '64px', letterSpacing: '-2.94px', fontWeight: '500' }],
        h2: ['48px', { lineHeight: '56px', letterSpacing: '-1.08px', fontWeight: '500' }],
        'h2-m': ['36px', { lineHeight: '40px', letterSpacing: '-0.81px', fontWeight: '500' }],
        h3: ['32px', { lineHeight: '40px', letterSpacing: '-0.72px', fontWeight: '500' }],
        h4: ['24px', { lineHeight: '32px', letterSpacing: '-0.3px', fontWeight: '500' }],
        h5: ['20px', { lineHeight: '28px', letterSpacing: '-0.225px', fontWeight: '500' }],
        'p-lg': ['18px', { lineHeight: '24px', letterSpacing: '-0.045px', fontWeight: '400' }],
        p: ['16px', { lineHeight: '24px', letterSpacing: '-0.2px', fontWeight: '400' }],
        'p-sm': ['14px', { lineHeight: '20px', letterSpacing: '-0.175px', fontWeight: '400' }],
        small: ['14px', { lineHeight: '20px', letterSpacing: '0.105px' }],
        label: ['12px', { lineHeight: '14.4px', letterSpacing: '-0.0125em', fontWeight: '400' }],
      },
      colors: {
        border: token('border'),
        'border-strong': token('border-strong'),
        'border-hover': token('border-hover'),
        hairline: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        primary: {
          DEFAULT: token('primary'),
          foreground: token('primary-foreground'),
        },
        secondary: {
          DEFAULT: token('secondary'),
          foreground: token('secondary-foreground'),
        },
        destructive: {
          DEFAULT: token('destructive'),
          foreground: token('destructive-foreground'),
        },
        muted: {
          DEFAULT: token('muted'),
          foreground: token('muted-foreground'),
        },
        accent: {
          DEFAULT: token('accent'),
          foreground: token('accent-foreground'),
        },
        popover: {
          DEFAULT: token('popover'),
          foreground: token('popover-foreground'),
        },
        card: {
          DEFAULT: token('card'),
          foreground: token('card-foreground'),
        },
        brand: {
          DEFAULT: token('brand'),
          foreground: token('brand-foreground'),
        },
        surface: {
          1: token('surface-1'),
          2: token('surface-2'),
          3: token('surface-3'),
          4: token('surface-4'),
          5: token('surface-5'),
        },
        fg: {
          DEFAULT: token('foreground'),
          secondary: token('fg-secondary'),
          gray: token('fg-gray'),
          tertiary: token('fg-tertiary'),
        },
        positive: token('positive'),
        negative: token('negative'),
        warning: token('warning'),
        info: token('info'),
        success: {
          DEFAULT: token('success'),
          foreground: token('success-foreground'),
        },
        chart: {
          ink: token('chart-ink'),
          1: token('chart-1'),
          2: token('chart-2'),
          3: token('chart-3'),
          4: token('chart-4'),
          5: token('chart-5'),
          6: token('chart-6'),
          7: token('chart-7'),
          8: token('chart-8'),
        },
      },
      borderRadius: {
        // 4 arrows · 6 badges · 8 buttons/frames · 10 fields · 12 menus/dialogs · 16 chart cards · 20 composer
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: 'var(--radius)',
        field: '10px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      maxWidth: {
        site: 'var(--container)',
      },
      spacing: {
        header: 'var(--header-h)',
        banner: 'var(--banner-h)',
        section: 'var(--section-gap)',
      },
      boxShadow: {
        'demo-surface': 'var(--shadow-demo-surface)',
        frame: 'var(--ring-frame)',
        'ring-secondary': '0 0 0 1px hsl(var(--secondary))',
        'field-focus': 'inset 0 0 0 1px rgb(255 255 255 / 0.25), 0 0 0 3px rgb(255 255 255 / 0.06)',
        field: 'inset 0 0 0 0.8px rgb(255 255 255 / 0.08)',
      },
      transitionTimingFunction: {
        house: 'var(--ease-house)',
        'out-expo': 'var(--ease-out-expo)',
        'out-quart': 'var(--ease-out-quart)',
        'in-quad': 'var(--ease-in-quad)',
        smoothstep: 'var(--ease-smoothstep)',
        swap: 'var(--ease-swap)',
        'smooth-out': 'var(--ease-smooth-out)',
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
        'accordion-down': 'accordion-down 250ms var(--ease-smooth-out)',
        'accordion-up': 'accordion-up 200ms var(--ease-smooth-out)',
        'banner-enter': 'banner-enter 1400ms var(--ease-out-expo) 400ms both',
        'blur-in': 'blur-in 600ms var(--ease-house) both',
        'fade-in': 'fade-in 300ms ease-out both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

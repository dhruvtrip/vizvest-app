import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // =======================================================================
      // COLORS
      // =======================================================================
      colors: {
        // Existing shadcn colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
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

        // Vizvest Navy palette (dark mode backgrounds)
        navy: {
          950: '#0a0f1a',
          900: '#0d1321',
          800: '#111827',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
          400: '#64748b',
          300: '#94a3b8',
          200: '#cbd5e1',
          100: '#e2e8f0',
          50: '#f8fafc',
        },

        // Electric accent colors
        electric: {
          cyan: '#06b6d4',
          'cyan-light': '#22d3ee',
          'cyan-dark': '#0891b2',
          blue: '#3b82f6',
          'blue-light': '#60a5fa',
          'blue-dark': '#2563eb',
          purple: '#8b5cf6',
          'purple-light': '#a78bfa',
          'purple-dark': '#7c3aed',
          pink: '#ec4899',
          'pink-light': '#f472b6',
          'pink-dark': '#db2777',
        },

        // Glow colors (semi-transparent for glow effects)
        glow: {
          cyan: 'rgba(6, 182, 212, 0.5)',
          'cyan-strong': 'rgba(6, 182, 212, 0.7)',
          'cyan-subtle': 'rgba(6, 182, 212, 0.3)',
          blue: 'rgba(59, 130, 246, 0.5)',
          'blue-strong': 'rgba(59, 130, 246, 0.7)',
          'blue-subtle': 'rgba(59, 130, 246, 0.3)',
          purple: 'rgba(139, 92, 246, 0.5)',
          'purple-strong': 'rgba(139, 92, 246, 0.7)',
          'purple-subtle': 'rgba(139, 92, 246, 0.3)',
        },

        // Glass colors for glassmorphism
        glass: {
          light: 'rgba(255, 255, 255, 0.05)',
          'light-medium': 'rgba(255, 255, 255, 0.1)',
          'light-strong': 'rgba(255, 255, 255, 0.15)',
          dark: 'rgba(0, 0, 0, 0.3)',
          'dark-medium': 'rgba(0, 0, 0, 0.5)',
          'dark-strong': 'rgba(0, 0, 0, 0.7)',
          border: 'rgba(255, 255, 255, 0.1)',
          'border-light': 'rgba(255, 255, 255, 0.2)',
        },

        // Semantic colors
        success: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
        },
      },

      // =======================================================================
      // BORDER RADIUS
      // =======================================================================
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      // =======================================================================
      // KEYFRAMES
      // =======================================================================
      keyframes: {
        // Fade animations
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },

        // Slide animations
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },

        // Scale animations
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },

        // Glow animations
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)' },
        },
        'pulse-glow-blue': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' },
        },
        'pulse-glow-purple': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },

        // Shimmer animation (for loading states)
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },

        // Float animation (subtle hovering effect)
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },

        // Spin with glow
        'spin-glow': {
          '0%': { transform: 'rotate(0deg)', filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' },
          '100%': { transform: 'rotate(360deg)', filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' },
        },

        // Gradient animation
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },

        // Border glow animation
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(6, 182, 212, 0.3)' },
          '50%': { borderColor: 'rgba(6, 182, 212, 0.8)' },
        },

        // Accordion animations (shadcn)
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },

        // Collapsible animations (shadcn)
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
      },

      // =======================================================================
      // ANIMATIONS
      // =======================================================================
      animation: {
        // Fade animations
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-fast': 'fadeIn 0.2s ease-out',
        'fade-in-slow': 'fadeIn 0.8s ease-out',
        'fade-out': 'fadeOut 0.5s ease-out',

        // Slide animations
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-up-fast': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-down-fast': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',

        // Scale animations
        'scale-in': 'scaleIn 0.3s ease-out',
        'scale-out': 'scaleOut 0.3s ease-out',

        // Glow animations
        glow: 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-glow-blue': 'pulse-glow-blue 2s ease-in-out infinite',
        'pulse-glow-purple': 'pulse-glow-purple 2s ease-in-out infinite',

        // Shimmer animation
        shimmer: 'shimmer 2s linear infinite',

        // Float animations
        float: 'float 3s ease-in-out infinite',
        'float-slow': 'float-slow 4s ease-in-out infinite',

        // Spin with glow
        'spin-glow': 'spin-glow 1s linear infinite',

        // Gradient shift
        'gradient-shift': 'gradient-shift 3s ease infinite',

        // Border glow
        'border-glow': 'border-glow 2s ease-in-out infinite',

        // Accordion (shadcn)
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',

        // Collapsible (shadcn)
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out',
      },

      // =======================================================================
      // BACKGROUND IMAGE
      // =======================================================================
      backgroundImage: {
        // Gradient utilities
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        
        // Grid patterns (for backgrounds)
        'grid-pattern': 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
        'grid-pattern-light': 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
        'grid-pattern-strong': 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
        
        // Dot patterns
        'dot-pattern': 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
        'dot-pattern-light': 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)',
        
        // Hero gradients
        'hero-gradient': 'linear-gradient(to bottom right, #0a0f1a, #111827, #0d1321)',
        'hero-gradient-light': 'linear-gradient(to bottom right, #f8fafc, #e2e8f0, #f1f5f9)',
        'hero-radial': 'radial-gradient(ellipse at center, #1e293b 0%, #0a0f1a 70%)',
        
        // Accent gradients
        'gradient-cyan-blue': 'linear-gradient(to right, #06b6d4, #3b82f6)',
        'gradient-blue-purple': 'linear-gradient(to right, #3b82f6, #8b5cf6)',
        'gradient-cyan-purple': 'linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)',
        'gradient-purple-pink': 'linear-gradient(to right, #8b5cf6, #ec4899)',
        
        // Shimmer gradient (for skeleton loading)
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        
        // Glow gradients (for background effects)
        'glow-cyan': 'radial-gradient(circle at center, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
        'glow-blue': 'radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        'glow-purple': 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        
        // Mesh gradient (complex background)
        'mesh-gradient': `
          radial-gradient(at 40% 20%, rgba(6, 182, 212, 0.15) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
          radial-gradient(at 80% 50%, rgba(236, 72, 153, 0.1) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(6, 182, 212, 0.1) 0px, transparent 50%)
        `.replace(/\s+/g, ' ').trim(),
      },

      // =======================================================================
      // BACKGROUND SIZE
      // =======================================================================
      backgroundSize: {
        'grid-sm': '20px 20px',
        'grid-md': '40px 40px',
        'grid-lg': '60px 60px',
        'dot-sm': '20px 20px',
        'dot-md': '30px 30px',
        'dot-lg': '40px 40px',
        'shimmer': '200% 100%',
      },

      // =======================================================================
      // BOX SHADOW
      // =======================================================================
      boxShadow: {
        // Glow shadows
        'glow-sm': '0 0 10px rgba(6, 182, 212, 0.3)',
        'glow-md': '0 0 20px rgba(6, 182, 212, 0.4)',
        'glow-lg': '0 0 30px rgba(6, 182, 212, 0.5)',
        'glow-xl': '0 0 50px rgba(6, 182, 212, 0.6)',
        
        'glow-blue-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        'glow-blue-md': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-blue-lg': '0 0 30px rgba(59, 130, 246, 0.5)',
        
        'glow-purple-sm': '0 0 10px rgba(139, 92, 246, 0.3)',
        'glow-purple-md': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-purple-lg': '0 0 30px rgba(139, 92, 246, 0.5)',
        
        // Glass shadows
        glass: '0 8px 32px rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.5)',
        
        // Inset shadows
        'inset-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
        'inset-md': 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        'inset-glow': 'inset 0 0 20px rgba(6, 182, 212, 0.1)',
        
        // Card shadows
        'card-hover': '0 20px 40px rgba(0, 0, 0, 0.3)',
      },

      // =======================================================================
      // BACKDROP BLUR
      // =======================================================================
      backdropBlur: {
        xs: '2px',
      },

      // =======================================================================
      // FONT FAMILY
      // =======================================================================
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
      },

      // =======================================================================
      // TRANSITION TIMING FUNCTION
      // =======================================================================
      transitionTimingFunction: {
        'ease-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.1)',
        'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'ease-in-back': 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
      },

      // =======================================================================
      // TRANSITION DURATION
      // =======================================================================
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

/**
 * Vizvest Design System Tokens
 * 
 * A comprehensive design system inspired by Aceternity UI and modern SaaS aesthetics.
 * Supports both light and dark modes with a dark-mode-first approach.
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Deep navy backgrounds (dark mode primary)
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
    cyanLight: '#22d3ee',
    cyanDark: '#0891b2',
    blue: '#3b82f6',
    blueLight: '#60a5fa',
    blueDark: '#2563eb',
    purple: '#8b5cf6',
    purpleLight: '#a78bfa',
    purpleDark: '#7c3aed',
    pink: '#ec4899',
    pinkLight: '#f472b6',
    pinkDark: '#db2777',
  },

  // Glow colors (with transparency)
  glow: {
    cyan: 'rgba(6, 182, 212, 0.5)',
    cyanStrong: 'rgba(6, 182, 212, 0.7)',
    cyanSubtle: 'rgba(6, 182, 212, 0.3)',
    blue: 'rgba(59, 130, 246, 0.5)',
    blueStrong: 'rgba(59, 130, 246, 0.7)',
    blueSubtle: 'rgba(59, 130, 246, 0.3)',
    purple: 'rgba(139, 92, 246, 0.5)',
    purpleStrong: 'rgba(139, 92, 246, 0.7)',
    purpleSubtle: 'rgba(139, 92, 246, 0.3)',
  },

  // Semantic colors
  semantic: {
    success: '#10b981',
    successLight: '#34d399',
    successDark: '#059669',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    warningDark: '#d97706',
    error: '#ef4444',
    errorLight: '#f87171',
    errorDark: '#dc2626',
    info: '#3b82f6',
    infoLight: '#60a5fa',
    infoDark: '#2563eb',
  },

  // Glassmorphism colors
  glass: {
    light: 'rgba(255, 255, 255, 0.05)',
    lightMedium: 'rgba(255, 255, 255, 0.1)',
    lightStrong: 'rgba(255, 255, 255, 0.15)',
    dark: 'rgba(0, 0, 0, 0.3)',
    darkMedium: 'rgba(0, 0, 0, 0.5)',
    darkStrong: 'rgba(0, 0, 0, 0.7)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.2)',
  },
} as const

// =============================================================================
// GRADIENTS
// =============================================================================

export const gradients = {
  // Hero/Background gradients
  heroBackground: 'linear-gradient(to bottom right, #0a0f1a, #111827, #0d1321)',
  heroRadial: 'radial-gradient(ellipse at center, #1e293b 0%, #0a0f1a 70%)',
  
  // Accent gradients
  cyanToBlue: 'linear-gradient(to right, #06b6d4, #3b82f6)',
  blueToPurple: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
  cyanToPurple: 'linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)',
  purpleToPink: 'linear-gradient(to right, #8b5cf6, #ec4899)',
  
  // Text gradients
  textPrimary: 'linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)',
  textAccent: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
  
  // Button gradients
  buttonPrimary: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  buttonSecondary: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  buttonHover: 'linear-gradient(135deg, #22d3ee, #60a5fa)',
  
  // Glow gradients (for backgrounds)
  glowCyan: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
  glowBlue: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
  glowPurple: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
  
  // Mesh gradients
  mesh: `
    radial-gradient(at 40% 20%, rgba(6, 182, 212, 0.15) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
    radial-gradient(at 80% 50%, rgba(236, 72, 153, 0.1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(6, 182, 212, 0.1) 0px, transparent 50%)
  `,
} as const

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
  },

  // Font sizes (px values for reference, use rem in CSS)
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
    '8xl': '6rem',      // 96px
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
} as const

// =============================================================================
// ANIMATIONS
// =============================================================================

export const animations = {
  // Duration tokens
  duration: {
    instant: '0ms',
    fastest: '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',
  },

  // Easing curves
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
    easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)',
  },

  // Framer Motion transition presets
  transition: {
    fast: { duration: 0.15, ease: [0, 0, 0.2, 1] },
    normal: { duration: 0.3, ease: [0, 0, 0.2, 1] },
    slow: { duration: 0.5, ease: [0, 0, 0.2, 1] },
    spring: { type: 'spring', stiffness: 400, damping: 30 },
    springBouncy: { type: 'spring', stiffness: 300, damping: 20 },
    springSmooth: { type: 'spring', stiffness: 200, damping: 25 },
  },
} as const

// =============================================================================
// FRAMER MOTION VARIANTS
// =============================================================================

export const motionVariants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },

  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  scaleInBounce: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },

  // Slide animations
  slideUp: {
    initial: { opacity: 0, y: '100%' },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' },
  },

  slideDown: {
    initial: { opacity: 0, y: '-100%' },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '-100%' },
  },

  // Stagger children animation
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },

  // Hover animations
  hoverScale: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },

  hoverLift: {
    y: -5,
    transition: { duration: 0.2 },
  },

  tapScale: {
    scale: 0.98,
  },

  // Glow pulse animation
  glowPulse: {
    initial: { boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' },
    animate: {
      boxShadow: [
        '0 0 20px rgba(6, 182, 212, 0.3)',
        '0 0 40px rgba(6, 182, 212, 0.6)',
        '0 0 20px rgba(6, 182, 212, 0.3)',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },

  // Float animation
  float: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
} as const

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  // Elevation shadows
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Glow shadows
  glowSm: '0 0 10px rgba(6, 182, 212, 0.3)',
  glowMd: '0 0 20px rgba(6, 182, 212, 0.4)',
  glowLg: '0 0 30px rgba(6, 182, 212, 0.5)',
  glowXl: '0 0 50px rgba(6, 182, 212, 0.6)',
  
  glowBlueSm: '0 0 10px rgba(59, 130, 246, 0.3)',
  glowBlueMd: '0 0 20px rgba(59, 130, 246, 0.4)',
  glowBlueLg: '0 0 30px rgba(59, 130, 246, 0.5)',
  
  glowPurpleSm: '0 0 10px rgba(139, 92, 246, 0.3)',
  glowPurpleMd: '0 0 20px rgba(139, 92, 246, 0.4)',
  glowPurpleLg: '0 0 30px rgba(139, 92, 246, 0.5)',

  // Glassmorphism shadow
  glass: '0 8px 32px rgba(0, 0, 0, 0.37)',
  glassLight: '0 8px 32px rgba(0, 0, 0, 0.1)',
  glassDark: '0 8px 32px rgba(0, 0, 0, 0.5)',

  // Inset shadows
  insetSm: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
  insetMd: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
  insetGlow: 'inset 0 0 20px rgba(6, 182, 212, 0.1)',
} as const

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
} as const

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const

// =============================================================================
// DESIGN SYSTEM EXPORT
// =============================================================================

export const designTokens = {
  colors,
  gradients,
  typography,
  spacing,
  animations,
  motionVariants,
  shadows,
  borderRadius,
  breakpoints,
  zIndex,
} as const

export default designTokens

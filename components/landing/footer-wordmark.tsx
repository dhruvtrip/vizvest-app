import { cn } from '@/lib/utils'

// The VIZVEST wordmark redrawn as vectors from public/assets/logo-full-light-nobg.png,
// so it stays sharp at full page width. The straight letters were rebuilt from
// points measured on the PNG and the S was traced. Units are the PNG's pixels.
const LETTERS =
  'M0 2H18.1L39.6 67L61.1 2H79.2L50 88.7H29.2Z' +
  'M92.7 2H109.7V88.7H92.7Z' +
  'M126.8 2H188.4V17.8L145.1 74.4H188.4V88.7H125V73.3L168.8 16.2H126.8Z' +
  'M195 2H213.1L234.6 67L256.1 2H274.2L245 88.7H224.2Z' +
  'M287.8 2H345.5V16.2H304.8V36.9H339.8V50.9H304.8V74.4H345.5V88.7H287.8Z' +
  'M428.4 2H495V16.2H470.15V88.7H453.15V16.2H428.4Z'

const S =
  'M380.33 0.38c-0.61 0.48-1.46 0.79-3.7 1.38-15.29 4.03-22.78 17.82-17.66 32.55 2.53 7.28 9.28 12.7 19.1 15.33 1.31 0.35 2.85 0.78 3.44 0.95 0.59 0.16 2.1 0.5 3.38 0.75 14.43 2.74 19.55 6.35 19.21 13.54-0.34 7.43-7.51 11.55-18.06 10.4-6.46-0.7-12.58-3.99-17.88-9.61-3.36-3.56-3.7-3.44-9.21 3.45-3.91 4.88-4.05 5.36-2.24 7.78 2.93 3.89 7.08 6.95 12.96 9.55 3.48 1.54 3.64 1.6 5.53 2.14 1.61 0.45 2.64 0.89 2.93 1.24 0.3 0.36 22.64 0.3 22.96-0.06 0.35-0.39 1-0.69 2.85-1.33 12.16-4.16 18.44-13.93 17.6-27.38-0.66-10.68-6.75-18.29-17.34-21.68-5.68-1.81-7.61-2.33-11.06-2.93-1.41-0.25-3.33-0.64-4.25-0.88-0.93-0.23-2.53-0.6-3.56-0.81-15.71-3.3-14.62-18.75 1.38-19.62 8.09-0.44 13.12 1.04 19.45 5.7 3.16 2.34 3.73 2.05 8.12-4.08 3.11-4.36 3.4-5.11 2.59-6.69-1.36-2.62-8.91-6.99-14.16-8.18-2.85-0.65-4.73-1.31-5-1.76-0.23-0.36-16.85-0.12-17.36 0.25z'

/** Full-width VIZVEST sign-off at the bottom of the footer. Decorative, since the footer already links the logo. */
export function FooterWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 495 90"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn('block h-auto w-full', className)}
    >
      <path d={LETTERS + S} />
    </svg>
  )
}

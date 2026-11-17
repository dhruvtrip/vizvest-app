import Image from 'next/image'
import { cn } from '@/lib/utils'

// The wordmark sits inside a padded 500px square. These are its bounds in
// that square, used to crop the padding away so the mark aligns like text.
const MARK = { left: 2, top: 208, width: 496, height: 91, canvas: 500 }

const imageStyle = {
  width: `${(MARK.canvas / MARK.width) * 100}%`,
  left: `${(-MARK.left / MARK.width) * 100}%`,
  top: `${(-MARK.top / MARK.height) * 100}%`,
}

interface LogoProps {
  /** Rendered height of the wordmark in px. */
  height?: number
  priority?: boolean
  className?: string
}

export function Logo({ height = 16, priority = false, className }: LogoProps) {
  return (
    <span
      className={cn('relative block shrink-0 overflow-hidden', className)}
      style={{ height, aspectRatio: `${MARK.width} / ${MARK.height}` }}
    >
      <Image
        src="/assets/logo-full-light-nobg.png"
        alt="Vizvest"
        width={MARK.canvas}
        height={MARK.canvas}
        priority={priority}
        sizes="120px"
        className="absolute h-auto max-w-none dark:hidden"
        style={imageStyle}
      />
      <Image
        src="/assets/logo-full-dark-nobg.png"
        alt="Vizvest"
        width={MARK.canvas}
        height={MARK.canvas}
        priority={priority}
        sizes="120px"
        className="absolute hidden h-auto max-w-none dark:block"
        style={imageStyle}
      />
    </span>
  )
}

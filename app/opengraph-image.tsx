import { OG_SIZE, renderOgImage } from '@/lib/og-image'

export const alt = 'Vizvest: see what your Trading 212 portfolio actually earned'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOgImage({
    title: 'See what your Trading 212 portfolio actually earned',
    subtitle: 'Dividends, realised profit, fees and every trade from one CSV export. Runs in your browser.',
  })
}

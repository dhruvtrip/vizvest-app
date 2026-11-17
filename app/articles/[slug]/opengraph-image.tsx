import { getArticleBySlug, getAllSlugs } from '@/lib/articles'
import { OG_SIZE, renderOgImage } from '@/lib/og-image'

export const alt = 'Vizvest guide for Trading 212 investors'
export const size = OG_SIZE
export const contentType = 'image/png'
export const revalidate = 3600

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  return renderOgImage({
    title: article?.meta.title ?? 'Guides for Trading 212 investors',
    eyebrow: 'Guide',
    subtitle: article ? `${article.meta.readingTime} · Vizvest guides` : undefined,
  })
}

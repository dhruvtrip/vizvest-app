import type { MetadataRoute } from 'next'
import { getArticles } from '@/lib/articles'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vizvest.cc'

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles()

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/articles/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...articleEntries,
  ]
}

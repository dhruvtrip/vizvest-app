import type { MetadataRoute } from 'next'
import { getArticles, getLatestArticleDate } from '@/lib/articles'
import { absoluteUrl } from '@/lib/site'

// Regenerate hourly so scheduled articles join the sitemap on their publish date.
export const revalidate = 3600

// Dates the static pages last changed in a way that matters to search engines.
// Update these when the page content changes, not on every deploy: a lastmod
// that moves on every build teaches Google to ignore it.
const HOME_UPDATED = new Date('2026-11-17')
const DASHBOARD_UPDATED = new Date('2026-11-17')
const ABOUT_UPDATED = new Date('2026-11-17')
const PRIVACY_UPDATED = new Date('2026-08-01')
const TERMS_UPDATED = new Date('2026-11-17')

function latest(...dates: (Date | undefined)[]): Date {
  return new Date(Math.max(...dates.filter((d): d is Date => d !== undefined).map((d) => d.getTime())))
}

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getArticles()
  const latestArticle = getLatestArticleDate()

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/articles/${article.slug}`),
    lastModified: new Date(article.lastModified ?? article.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [
    {
      url: absoluteUrl('/'),
      // The home page lists the latest guides, so it changes when they do.
      lastModified: latest(HOME_UPDATED, latestArticle),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: absoluteUrl('/dashboard'),
      lastModified: DASHBOARD_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/articles'),
      lastModified: latest(HOME_UPDATED, latestArticle),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...articleEntries,
    {
      url: absoluteUrl('/about'),
      lastModified: ABOUT_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: absoluteUrl('/privacy'),
      lastModified: PRIVACY_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/terms'),
      lastModified: TERMS_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}

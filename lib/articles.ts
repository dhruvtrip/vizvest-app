import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { ArticleMeta } from '@/types/article'

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles')

function getSlugFromFilename(filename: string): string {
  return filename.replace(/\.mdx$/, '')
}

/**
 * An article is live once it is marked published and its date has arrived.
 * A future `date` schedules it: pages that list articles revalidate hourly,
 * so it appears on the site, the sitemap, RSS and llms.txt on that day
 * without a redeploy.
 */
export function isLive(frontmatter: Record<string, unknown>, now: Date = new Date()): boolean {
  if (frontmatter.published !== true) return false
  const date = frontmatter.date
  if (typeof date !== 'string') return false
  const publishAt = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(publishAt.getTime())) return false
  return publishAt.getTime() <= now.getTime()
}

function toMeta(slug: string, data: Record<string, unknown>, content: string): ArticleMeta {
  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    lastModified: data.lastModified as string | undefined,
    author: data.author as string | undefined,
    tags: (data.tags as string[]) ?? [],
    image: data.image as string | undefined,
    published: true,
    faqs: data.faqs as ArticleMeta['faqs'],
    readingTime: readingTime(content).text,
  }
}

function readArticle(slug: string): { data: Record<string, unknown>; content: string } | null {
  const filepath = path.join(ARTICLES_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filepath)) return null
  const { data, content } = matter(fs.readFileSync(filepath, 'utf-8'))
  return { data: data as Record<string, unknown>, content }
}

function listSlugs(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return []
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map(getSlugFromFilename)
}

/** Live articles, newest first. */
export function getArticles(now: Date = new Date()): ArticleMeta[] {
  const articles: ArticleMeta[] = []

  for (const slug of listSlugs()) {
    const article = readArticle(slug)
    if (!article || !isLive(article.data, now)) continue
    articles.push(toMeta(slug, article.data, article.content))
  }

  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getArticleBySlug(
  slug: string,
  now: Date = new Date()
): { meta: ArticleMeta; content: string } | null {
  const article = readArticle(slug)
  if (!article || !isLive(article.data, now)) return null
  return { meta: toMeta(slug, article.data, article.content), content: article.content }
}

export function getAllSlugs(now: Date = new Date()): string[] {
  return getArticles(now).map((a) => a.slug)
}

/** Up to `limit` other live articles, preferring ones that share tags. */
export function getRelatedArticles(slug: string, limit = 3, now: Date = new Date()): ArticleMeta[] {
  const articles = getArticles(now)
  const current = articles.find((a) => a.slug === slug)
  const generic = new Set(['trading-212'])
  const tags = new Set((current?.tags ?? []).filter((t) => !generic.has(t)))

  return articles
    .filter((a) => a.slug !== slug)
    .map((a, index) => ({ a, index, shared: a.tags.filter((t) => tags.has(t)).length }))
    .sort((x, y) => y.shared - x.shared || x.index - y.index)
    .slice(0, limit)
    .map(({ a }) => a)
}

/** Most recent date any live article was published or updated. */
export function getLatestArticleDate(now: Date = new Date()): Date | undefined {
  const times = getArticles(now).map((a) => new Date(a.lastModified ?? a.date).getTime())
  return times.length > 0 ? new Date(Math.max(...times)) : undefined
}

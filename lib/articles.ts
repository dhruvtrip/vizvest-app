import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { ArticleMeta } from '@/types/article'

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles')

function getSlugFromFilename(filename: string): string {
  return filename.replace(/\.mdx$/, '')
}

export function getArticles(): ArticleMeta[] {
  if (!fs.existsSync(ARTICLES_DIR)) return []

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.mdx'))

  const articles: ArticleMeta[] = []

  for (const filename of files) {
    const slug = getSlugFromFilename(filename)
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, filename), 'utf-8')
    const { data, content } = matter(raw)
    const frontmatter = data as Record<string, unknown>

    if (!frontmatter.published) continue

    const article: ArticleMeta = {
      slug,
      title: frontmatter.title as string,
      description: frontmatter.description as string,
      date: frontmatter.date as string,
      author: frontmatter.author as string,
      tags: (frontmatter.tags as string[]) ?? [],
      image: frontmatter.image as string | undefined,
      published: true,
      readingTime: readingTime(content).text,
    }

    articles.push(article)
  }

  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getArticleBySlug(slug: string): { meta: ArticleMeta; content: string } | null {
  const filepath = path.join(ARTICLES_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filepath)) return null

  const raw = fs.readFileSync(filepath, 'utf-8')
  const { data, content } = matter(raw)
  const frontmatter = data as Record<string, unknown>

  if (!frontmatter.published) return null

  const meta: ArticleMeta = {
    slug,
    title: frontmatter.title as string,
    description: frontmatter.description as string,
    date: frontmatter.date as string,
    author: frontmatter.author as string,
    tags: (frontmatter.tags as string[]) ?? [],
    image: frontmatter.image as string | undefined,
    published: true,
    readingTime: readingTime(content).text,
  }

  return { meta, content }
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return []
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map(getSlugFromFilename)
    .filter((slug) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, `${slug}.mdx`), 'utf-8')
      const { data } = matter(raw)
      return (data as Record<string, unknown>).published === true
    })
}

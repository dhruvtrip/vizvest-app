export interface ArticleFaq {
  question: string
  answer: string
}

export interface ArticleFrontmatter {
  title: string
  description: string
  date: string
  lastModified?: string
  author?: string
  tags: string[]
  image?: string
  published: boolean
  faqs?: ArticleFaq[]
}

export interface ArticleMeta extends ArticleFrontmatter {
  slug: string
  readingTime: string
}

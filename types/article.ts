export interface ArticleFrontmatter {
  title: string
  description: string
  date: string
  lastModified?: string
  tags: string[]
  image?: string
  published: boolean
}

export interface ArticleMeta extends ArticleFrontmatter {
  slug: string
  readingTime: string
}

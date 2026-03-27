export interface ArticleFrontmatter {
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  image?: string
  published: boolean
}

export interface ArticleMeta extends ArticleFrontmatter {
  slug: string
  readingTime: string
}

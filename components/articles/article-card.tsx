import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StaggerItem } from '@/components/motion/blur-reveal'
import type { ArticleMeta } from '@/types/article'

interface ArticleCardProps {
  article: ArticleMeta
  /** Kept for API compatibility; the entrance stagger now comes from the parent `StaggerIn`. */
  index?: number
}

/**
 * One cell in the articles hairline grid. The cell owns the borders (via the
 * parent `.cell-grid`); only the content blurs in, so the grid lines stay put.
 */
export function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = new Date(article.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="min-w-0">
      <StaggerItem className="h-full">
        <Link
          href={`/articles/${article.slug}`}
          className="group flex h-full flex-col p-6 transition-[background-color] duration-150 ease-out hover:bg-white/[0.03] focus-visible:-outline-offset-2 lg:min-h-[360px]"
        >
          <article className="flex flex-1 flex-col">
            <p className="tabular text-label text-fg-gray">
              <time dateTime={article.date}>{formattedDate}</time>
              <span aria-hidden="true"> · </span>
              {article.readingTime}
            </p>

            <h2 className="mt-6 text-h5 text-foreground">{article.title}</h2>

            <p className="mt-3 line-clamp-3 text-pretty text-p-sm text-fg-secondary">
              {article.description}
            </p>

            <div className="mt-auto pt-8">
              {article.tags.length > 0 ? (
                <ul className="mb-6 flex flex-wrap gap-1.5" aria-label="Tags">
                  {article.tags.slice(0, 3).map((tag) => (
                    <li key={tag}>
                      <Badge variant="outline">{tag}</Badge>
                    </li>
                  ))}
                </ul>
              ) : null}

              <span className="inline-flex items-center gap-1 text-p-sm text-fg-secondary transition-[color] duration-200 ease-out group-hover:text-foreground">
                Read article
                <ArrowRight
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 transition-transform duration-200 ease-house group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </article>
        </Link>
      </StaggerItem>
    </div>
  )
}

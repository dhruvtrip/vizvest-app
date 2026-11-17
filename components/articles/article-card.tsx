import Link from 'next/link'
import { ArrowUpRight } from '@/components/icons'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/motion/reveal'
import type { ArticleMeta } from '@/types/article'

interface ArticleCardProps {
  article: ArticleMeta
  index: number
  /** h2 on the articles index, h3 where the cards sit under their own heading. */
  headingLevel?: 2 | 3
}

// Cards land one after another, the last no more than 400ms behind the first.
const STAGGER = 0.08
const MAX_DELAY = 0.4

export function ArticleCard({ article, index, headingLevel = 2 }: ArticleCardProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  const formattedDate = new Date(article.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <Reveal delay={Math.min(index * STAGGER, MAX_DELAY)} className="h-full">
      <Link href={`/articles/${article.slug}`} className="group block h-full rounded-3xl">
        <Card
          className="flex h-full flex-col p-6 transition-[background-color,border-color] duration-150 ease-ui group-hover:border-muted-foreground/30 group-hover:bg-muted dark:group-hover:bg-muted-foreground/20"
        >
          <article className="flex h-full flex-col">
            <Heading className="heading-card text-foreground">{article.title}</Heading>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {article.description}
            </p>
            <div className="mt-auto flex items-center justify-between gap-4 pt-6">
              <p className="figure flex flex-wrap items-center gap-x-2 text-sm font-normal text-muted-foreground">
                <time dateTime={article.date}>{formattedDate}</time>
                <span aria-hidden="true">·</span>
                <span>{article.readingTime}</span>
              </p>
              <ArrowUpRight
                size={16}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground transition-[color,transform] duration-150 ease-ui group-hover:text-foreground motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
              />
            </div>
          </article>
        </Card>
      </Link>
    </Reveal>
  )
}

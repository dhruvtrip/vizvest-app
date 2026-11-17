import Link from 'next/link'
import { ArticleCard } from '@/components/articles/article-card'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/motion/reveal'
import type { ArticleMeta } from '@/types/article'
import { SectionHeading } from './section-heading'

interface LatestGuidesProps {
  articles: ArticleMeta[]
}

/** The newest guides, so the home page links straight to them. */
export function LatestGuides({ articles }: LatestGuidesProps) {
  if (articles.length === 0) return null

  return (
    <section aria-labelledby="guides-heading" className="mx-auto w-full max-w-content">
      <Reveal>
        <SectionHeading
          id="guides-heading"
          title="Guides for Trading 212 investors"
          description="Exports, dividends, fees and returns, explained in plain English."
        />
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 lg:mt-12">
        {articles.map((article, i) => (
          <ArticleCard key={article.slug} article={article} index={i} headingLevel={3} />
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline">
          <Link href="/articles">All guides</Link>
        </Button>
      </div>
    </section>
  )
}

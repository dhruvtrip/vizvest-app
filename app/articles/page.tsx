import type { Metadata } from 'next'
import { Navbar, Footer } from '@/components/landing'
import { ArticleCard } from '@/components/articles/article-card'
import { Reveal } from '@/components/motion/reveal'
import { getArticles } from '@/lib/articles'

export const metadata: Metadata = {
  title: 'Trading 212 Guides & Portfolio Investing Articles | Vizvest',
  description:
    'Guides on Trading 212 portfolio tracking, dividend investing, P&L, and making the most of your investment data.',
  openGraph: {
    title: 'Trading 212 Guides & Portfolio Investing Articles | Vizvest',
    description:
      'Guides on Trading 212 portfolio tracking, dividend investing, P&L, and making the most of your investment data.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/articles`,
    type: 'website',
  },
}

export default function ArticlesPage() {
  const articles = getArticles()

  return (
    <div className="relative overflow-x-clip">
      <div className="page-glow" aria-hidden="true" />
      <Navbar />
      <main id="main-content" className="relative px-4 pb-28 pt-32 lg:pb-section lg:pt-40">
        <div className="mx-auto w-full max-w-content">
          <Reveal>
            <header className="flex max-w-2xl flex-col gap-6">
              <h1 className="heading-display lg:text-6xl">Guides for Trading&nbsp;212 investors</h1>
              <p className="text-lead max-w-xl">
                How to export your data, read your dividends and check your real returns, one step at a time.
              </p>
            </header>
          </Reveal>

          {articles.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-16 lg:grid-cols-3">
              {articles.map((article, i) => (
                <ArticleCard key={article.slug} article={article} index={i} />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-base text-muted-foreground lg:mt-16">
              There are no articles yet. New guides will appear here.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

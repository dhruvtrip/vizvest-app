import type { Metadata } from 'next'
import { Navbar, Footer } from '@/components/landing'
import { ArticleCard } from '@/components/articles/article-card'
import { Container, GridGuides } from '@/components/layout/container'
import { SectionHeader } from '@/components/layout/section-header'
import { StaggerIn } from '@/components/motion/blur-reveal'
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
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pb-24 md:pb-32">
        <GridGuides />
        <Container>
          <div className="pt-12 md:pt-24">
            <SectionHeader
              as="h1"
              className="blur-in"
              title="Trading 212 Guides & Portfolio Analysis"
              description="Step-by-step guides on understanding your investment data and returns."
            />
          </div>

          {articles.length > 0 ? (
            <StaggerIn immediate delay={0.1} className="cell-grid grid-cols-1 lg:grid-cols-3">
              {articles.map((article, i) => (
                <ArticleCard key={article.slug} article={article} index={i} />
              ))}
            </StaggerIn>
          ) : (
            <div className="cell-grid">
              <div className="px-6 py-16">
                <p className="text-p-sm text-fg-secondary">No articles yet. Check back soon.</p>
              </div>
            </div>
          )}
        </Container>
      </section>

      <Footer />
    </main>
  )
}

import type { Metadata } from 'next'
import { Navbar, Footer } from '@/components/landing'
import { ArticleCard } from '@/components/articles/article-card'
import { getArticles } from '@/lib/articles'
import { FileText } from 'lucide-react'

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
    <main className="min-h-screen">
      <Navbar />

      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),transparent)]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-accent/20 dark:bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        </div>

        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-4">Trading 212 Guides & Portfolio Analysis</h1>
            <p className="text-base text-muted-foreground/80 leading-relaxed">
              Step-by-step guides on understanding your investment data and returns.
            </p>
          </div>

          {/* Grid */}
          {articles.length > 0 ? (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((article, i) => (
                <ArticleCard key={article.slug} article={article} index={i} />
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center py-20">
              <p className="text-muted-foreground/60 text-sm">
                No articles yet — check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

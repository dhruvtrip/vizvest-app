import type { Metadata } from 'next'
import { Navbar, Footer } from '@/components/landing'
import { ArticleCard } from '@/components/articles/article-card'
import { getArticles } from '@/lib/articles'
import { pageMetadata } from '@/lib/metadata'
import { SITE_NAME, WEBSITE_ID, absoluteUrl } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'Trading 212 Guides: Exports, Dividends, Fees & Returns | Vizvest',
  socialTitle: 'Guides for Trading 212 investors',
  description:
    'Plain-English guides for Trading 212 investors: exporting your CSV, tracking dividends, understanding fees, pies, currency and working out your real return.',
  path: '/articles',
})

// Scheduled articles appear here on their publish date without a redeploy.
export const revalidate = 3600

export default function ArticlesPage() {
  const articles = getArticles()
  const url = absoluteUrl('/articles')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name: 'Guides for Trading 212 investors',
        inLanguage: 'en-GB',
        isPartOf: { '@id': WEBSITE_ID },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: articles.map((article, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: absoluteUrl(`/articles/${article.slug}`),
            name: article.title,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Articles', item: url },
        ],
      },
    ],
  }

  return (
    <div className="relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="page-glow" aria-hidden="true" />
      <Navbar />
      <main id="main-content" className="relative px-4 pb-28 pt-32 lg:pb-section lg:pt-40">
        <div className="mx-auto w-full max-w-content">
          <header className="t-rise-in flex max-w-2xl flex-col gap-6">
            <h1 className="heading-display lg:text-6xl">Guides for Trading&nbsp;212 investors</h1>
            <p className="text-lead max-w-xl">
              How to export your data, read your dividends and check your real returns, one step at a time.
            </p>
          </header>

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

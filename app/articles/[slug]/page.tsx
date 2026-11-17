import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { ArrowLeft } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/motion/reveal'
import { Navbar, Footer } from '@/components/landing'
import { getMDXComponents } from '@/components/articles/mdx-components'
import { ArticleCard } from '@/components/articles/article-card'
import { getArticleBySlug, getAllSlugs, getRelatedArticles } from '@/lib/articles'
import { pageMetadata } from '@/lib/metadata'
import { ORGANIZATION_ID, SITE_NAME, WEBSITE_ID, absoluteUrl } from '@/lib/site'

interface Props {
  params: Promise<{ slug: string }>
}

// Scheduled articles (future `date`) render on demand once their day arrives.
export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const result = getArticleBySlug(slug)
  if (!result) return {}

  const { meta } = result

  return pageMetadata({
    title: meta.title.length <= 50 ? `${meta.title} | Vizvest` : meta.title,
    socialTitle: meta.title,
    description: meta.description,
    path: `/articles/${slug}`,
    type: 'article',
    publishedTime: meta.date,
    modifiedTime: meta.lastModified,
    tags: meta.tags,
  })
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const result = getArticleBySlug(slug)
  if (!result) notFound()

  const { meta, content } = result
  const url = absoluteUrl(`/articles/${slug}`)
  const related = getRelatedArticles(slug)
  const updated = meta.lastModified && meta.lastModified > meta.date ? meta.lastModified : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline: meta.title,
        description: meta.description,
        datePublished: meta.date,
        dateModified: meta.lastModified ?? meta.date,
        inLanguage: 'en-GB',
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        isPartOf: { '@id': WEBSITE_ID },
        image: meta.image ? absoluteUrl(meta.image) : `${url}/opengraph-image`,
        author: meta.author
          ? {
              '@type': 'Person',
              name: meta.author,
              jobTitle: 'Founder',
              url: absoluteUrl('/about'),
              worksFor: { '@id': ORGANIZATION_ID },
            }
          : { '@id': ORGANIZATION_ID },
        publisher: { '@id': ORGANIZATION_ID },
        keywords: meta.tags.join(', '),
        wordCount: content.split(/\s+/).filter(Boolean).length,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Articles', item: absoluteUrl('/articles') },
          { '@type': 'ListItem', position: 3, name: meta.title, item: url },
        ],
      },
    ],
  }

  const faqJsonLd = meta.faqs && meta.faqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: meta.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null

  return (
    <>
      {/* PostHog inserts its add-on scripts before the first `body > script`.
          Keeping JSON-LD inside this div stops that from breaking hydration. */}
      <div className="relative overflow-x-clip">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {faqJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        )}
        <div className="page-glow" aria-hidden="true" />
        <Navbar />
        <main id="main-content" className="relative px-4 pb-28 pt-32 lg:pb-section lg:pt-40">
          <div className="mx-auto w-full max-w-prose">
            <Link
              href="/articles"
              className="group -ml-1 inline-flex h-9 items-center gap-1.5 rounded-md px-1 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-ui hover:text-foreground"
            >
              <ArrowLeft
                size={16}
                strokeWidth={2}
                className="transition-transform duration-150 ease-ui motion-safe:group-hover:-translate-x-0.5"
              />
              All articles
            </Link>

            <article className="mt-8">
              <header className="border-b border-border pb-8">
                <h1 className="text-[1.75rem] font-light leading-[2.125rem] tracking-[-0.035em] min-[360px]:text-[2rem] min-[360px]:leading-[2.375rem] text-foreground sm:text-[2.5rem] sm:leading-[2.875rem] lg:text-5xl lg:leading-[3.375rem]">
                  {meta.title}
                </h1>
                <p className="figure mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-normal text-muted-foreground">
                  <time dateTime={meta.date}>{formatDate(meta.date)}</time>
                  {updated && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        Updated <time dateTime={updated}>{formatDate(updated)}</time>
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{meta.readingTime}</span>
                  {meta.author && (
                    <>
                      <span aria-hidden="true" className="hidden sm:inline">
                        ·
                      </span>
                      <span className="basis-full sm:basis-auto">
                        <Link href="/about" className="underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 ease-ui hover:text-foreground">
                          {meta.author}
                        </Link>
                        , founder of Vizvest
                      </span>
                    </>
                  )}
                </p>
              </header>

              <div className="mt-10">
                <MDXRemote
                  source={content}
                  components={getMDXComponents()}
                  options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
                />
              </div>
            </article>

            {related.length > 0 && (
              <section aria-labelledby="related-heading" className="mt-16 border-t border-border pt-12 lg:mt-20">
                <h2 id="related-heading" className="heading-card text-foreground">
                  Keep reading
                </h2>
                <div className="mt-6 grid grid-cols-1 gap-4">
                  {related.map((article, i) => (
                    <ArticleCard key={article.slug} article={article} index={i} headingLevel={3} />
                  ))}
                </div>
              </section>
            )}

            <Reveal className="mt-16 lg:mt-20">
              <aside
                aria-labelledby="article-cta-heading"
                className="panel-texture rounded-4xl px-6 py-12 text-center sm:px-12 sm:py-14"
              >
                <h2 id="article-cta-heading" className="text-2xl font-medium tracking-tight text-white sm:text-3xl">
                  See your own numbers
                </h2>
                <p className="mx-auto mt-3 max-w-md text-base text-white/70">
                  Upload your Trading 212 export and get dividends, profit and fees in one dashboard. The file stays in
                  your browser.
                </p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button asChild variant="light" className="w-full sm:w-auto">
                    <Link href="/dashboard">Open the dashboard</Link>
                  </Button>
                  <Button asChild variant="outline-light" className="w-full sm:w-auto">
                    <Link href="/articles">More articles</Link>
                  </Button>
                </div>
              </aside>
            </Reveal>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}

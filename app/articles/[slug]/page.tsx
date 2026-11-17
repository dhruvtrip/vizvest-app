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
import { getArticleBySlug, getAllSlugs } from '@/lib/articles'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vizvest.cc'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const result = getArticleBySlug(slug)
  if (!result) return {}

  const { meta } = result
  const url = `${SITE_URL}/articles/${slug}`

  return {
    title: meta.title.length <= 50 ? `${meta.title} | Vizvest` : meta.title,
    description: meta.description,
    keywords: meta.tags,
    openGraph: {
      type: 'article',
      title: meta.title,
      description: meta.description,
      url,
      publishedTime: meta.date,
      tags: meta.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
    alternates: { canonical: url },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const result = getArticleBySlug(slug)
  if (!result) notFound()

  const { meta, content } = result
  const url = `${SITE_URL}/articles/${slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    ...(meta.lastModified && { dateModified: meta.lastModified }),
    author: meta.author
      ? {
          '@type': 'Person',
          name: meta.author,
          jobTitle: 'Founder',
          worksFor: {
            '@type': 'Organization',
            name: 'Vizvest',
            url: SITE_URL,
          },
        }
      : {
          '@type': 'Organization',
          name: 'Vizvest',
          url: SITE_URL,
        },
    publisher: {
      '@type': 'Organization',
      name: 'Vizvest',
      url: SITE_URL,
    },
    url,
    keywords: meta.tags.join(', '),
    ...(meta.image && { image: `${SITE_URL}${meta.image}` }),
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

  const formattedDate = new Date(meta.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

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
                  <time dateTime={meta.date}>{formattedDate}</time>
                  <span aria-hidden="true">·</span>
                  <span>{meta.readingTime}</span>
                  {meta.author && (
                    <>
                      <span aria-hidden="true" className="hidden sm:inline">
                        ·
                      </span>
                      <span className="basis-full sm:basis-auto">{meta.author}, founder of Vizvest</span>
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

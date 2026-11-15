import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Navbar, Footer } from '@/components/landing'
import { getMDXComponents, withPipeTables } from '@/components/articles/mdx-components'
import { ReadingBody, ReadingHeader, ReadingShell } from '@/components/articles/reading-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    <div className="min-h-screen bg-background">
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
      <Navbar />

      <main id="main-content">
      <ReadingShell className="pb-24 md:pb-32">
        <article>
          <ReadingHeader
            back={{ href: '/articles', label: 'All articles' }}
            meta={
              <p>
                <time dateTime={meta.date}>{formattedDate}</time>
                <span aria-hidden="true"> · </span>
                {meta.readingTime}
                {meta.author ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    {meta.author}, Founder of Vizvest
                  </>
                ) : null}
              </p>
            }
            title={meta.title}
            description={meta.description}
          >
            {meta.tags.length > 0 ? (
              <ul className="mt-8 flex flex-wrap gap-1.5" aria-label="Tags">
                {meta.tags.map((tag) => (
                  <li key={tag}>
                    <Badge variant="outline">{tag}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </ReadingHeader>

          <ReadingBody>
            <MDXRemote source={withPipeTables(content)} components={getMDXComponents()} />
          </ReadingBody>
        </article>

        {/* Footer nav / CTA */}
        <nav
          aria-label="Article navigation"
          className="flex flex-col gap-8 border border-border px-6 py-10 md:flex-row md:items-end md:justify-between md:py-12"
        >
          <div>
            <h2 className="text-h4 text-foreground">See your own numbers</h2>
            <p className="mt-2 max-w-[440px] text-pretty text-p text-fg-secondary">
              Upload your Trading 212 CSV and get the full picture in seconds, processed in your browser.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-3">
            <Button asChild variant="secondary">
              <Link href="/articles">
                <ArrowLeft aria-hidden="true" strokeWidth={1.5} />
                All articles
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                Open dashboard
                <ArrowRight aria-hidden="true" strokeWidth={1.5} />
              </Link>
            </Button>
          </div>
        </nav>
      </ReadingShell>

      </main>

      <Footer />
    </div>
  )
}

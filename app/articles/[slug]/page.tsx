import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react'
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
    <main className="min-h-screen">
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

        <div className="relative pt-28 pb-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(120,119,198,0.1),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(120,119,198,0.2),transparent)]" />
          </div>

          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              {/* Back link */}
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-primary transition-colors mb-10 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                Back to Articles
              </Link>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-border text-muted-foreground/60 bg-muted/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground leading-tight mb-6">
                {meta.title}
              </h1>

              {/* Meta bar */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground/60 border-y border-border py-4 mb-10">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <time dateTime={meta.date}>{formattedDate}</time>
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {meta.readingTime}
                </span>
                {meta.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {meta.author} · Founder, Vizvest
                  </span>
                )}
              </div>

              {/* MDX Content */}
              <article className="prose-custom">
                <MDXRemote source={content} components={getMDXComponents()} />
              </article>

              {/* Footer nav */}
              <div className="mt-16 pt-8 border-t border-border">
                <Link
                  href="/articles"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-primary transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                  All Articles
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Footer />
    </main>
  )
}

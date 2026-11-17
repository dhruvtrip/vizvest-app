import type { Metadata } from 'next'
import { SITE_NAME, absoluteUrl } from '@/lib/site'

interface PageMetadataInput {
  title: string
  description: string
  /** Path from the site root, e.g. `/articles`. Becomes the canonical URL. */
  path: string
  /** Shorter title for social cards. Defaults to `title`. */
  socialTitle?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
  noindex?: boolean
}

/**
 * Metadata for one page. Every page sets its own canonical, because a child
 * that doesn't inherits the root's and tells Google it is a copy of the home
 * page. Open Graph is rebuilt in full here since Next replaces the parent's
 * `openGraph` object rather than merging into it.
 */
export function pageMetadata({
  title,
  description,
  path,
  socialTitle,
  type = 'website',
  publishedTime,
  modifiedTime,
  tags,
  noindex = false,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path)
  const shareTitle = socialTitle ?? title
  // Pages that set `openGraph` drop the root opengraph-image, so name it here.
  // Articles have their own opengraph-image file, so they leave this unset.
  const images =
    type === 'article'
      ? undefined
      : [{ url: absoluteUrl('/opengraph-image'), width: 1200, height: 630, alt: shareTitle }]

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      title: shareTitle,
      description,
      siteName: SITE_NAME,
      locale: 'en_GB',
      ...(images && { images }),
      ...(type === 'article' && {
        publishedTime,
        modifiedTime: modifiedTime ?? publishedTime,
        tags,
        authors: [absoluteUrl('/about')],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      ...(images && { images: images.map((i) => i.url) }),
    },
    ...(noindex && { robots: { index: false, follow: true } }),
  }
}

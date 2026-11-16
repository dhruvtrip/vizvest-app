import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Reading type shared by articles and the privacy policy: 17/28 regular body
 * in the foreground colour, medium headings with room above them.
 */
export const prose = {
  p: 'my-5 text-[1.0625rem] font-normal leading-7 text-foreground',
  h2: 'mb-4 mt-14 scroll-mt-28 text-2xl font-medium leading-8 tracking-tight text-foreground first:mt-0 sm:text-[1.75rem] sm:leading-9',
  h3: 'mb-3 mt-10 scroll-mt-28 text-xl font-medium leading-7 tracking-tight text-foreground',
  h4: 'mb-2 mt-8 scroll-mt-28 text-lg font-medium leading-7 text-foreground',
  ul: 'my-5 list-disc space-y-2.5 pl-6 text-[1.0625rem] font-normal leading-7 text-foreground marker:text-muted-foreground',
  ol: 'my-5 list-decimal space-y-2.5 pl-6 text-[1.0625rem] font-normal leading-7 text-foreground marker:text-muted-foreground',
  li: 'pl-1.5 [&>ol]:my-2 [&>p]:my-0 [&>ul]:my-2',
  link: 'rounded-sm underline decoration-foreground/30 decoration-1 underline-offset-4 transition-colors duration-150 ease-ui hover:text-brand hover:decoration-brand/60 dark:hover:text-foreground dark:hover:decoration-foreground/70',
  strong: 'font-medium text-foreground',
}

export function getMDXComponents(): MDXComponents {
  return {
    // The page title is the only h1, so a stray h1 in an article body becomes an h2.
    h1: ({ children }) => <h2 className={prose.h2}>{children}</h2>,
    h2: ({ children }) => <h2 className={prose.h2}>{children}</h2>,
    h3: ({ children }) => <h3 className={prose.h3}>{children}</h3>,
    h4: ({ children }) => <h4 className={prose.h4}>{children}</h4>,
    p: ({ children }) => <p className={prose.p}>{children}</p>,
    a: ({ href, children }) => {
      const isExternal = href?.startsWith('http')
      if (isExternal) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className={prose.link}>
            {children}
          </a>
        )
      }
      return (
        <Link href={href ?? '#'} className={prose.link}>
          {children}
        </Link>
      )
    },
    ul: ({ children }) => <ul className={prose.ul}>{children}</ul>,
    ol: ({ children }) => <ol className={prose.ol}>{children}</ol>,
    li: ({ children }) => <li className={prose.li}>{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l border-border pl-5 [&_li]:text-muted-foreground [&_p]:my-3 [&_p]:text-muted-foreground">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="rounded-md bg-muted px-1.5 py-0.5 text-[0.9375rem] font-normal text-foreground">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre
        tabIndex={0}
        className="my-8 overflow-x-auto overscroll-x-contain rounded-2xl bg-muted p-5 text-[0.9375rem] font-normal leading-6 text-foreground [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0"
      >
        {children}
      </pre>
    ),
    img: ({ src, alt, className }) => (
      // Article images come from frontmatter-free markdown with no known size, so a plain img is used.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={typeof src === 'string' ? src : undefined}
        alt={alt ?? ''}
        loading="lazy"
        className={cn('image-outline my-8 block h-auto w-full rounded-2xl', className)}
      />
    ),
    hr: () => <hr className="my-12 border-0 border-t border-border" />,
    strong: ({ children }) => <strong className={prose.strong}>{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    table: ({ children }) => (
      <div tabIndex={0} className="my-8 overflow-x-auto overscroll-x-contain">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="min-w-[7.5rem] border-b border-border py-3 pr-6 align-bottom text-sm font-medium leading-5 text-foreground last:pr-0">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="min-w-[7.5rem] border-b border-border py-3 pr-6 align-top text-sm font-normal leading-relaxed text-foreground last:pr-0">
        {children}
      </td>
    ),
  }
}

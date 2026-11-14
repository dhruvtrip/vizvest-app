import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Reading styles shared by articles and the privacy policy. One family (Inter),
 * weight 500 for headings, hairlines instead of boxes, a 28px body line-height.
 */
export const reading = {
  h1: 'mt-12 mb-4 text-h3 text-foreground',
  h2: 'mt-12 mb-4 scroll-mt-20 text-h4 text-foreground',
  h3: 'mt-8 mb-3 scroll-mt-20 text-h5 text-foreground',
  p: 'my-5 text-pretty text-p leading-7 text-foreground/80',
  a: 'text-foreground underline decoration-border-hover underline-offset-4 transition-[text-decoration-color] duration-200 ease-in-out hover:decoration-foreground',
  ul: 'my-5 list-disc space-y-2 pl-6 marker:text-border-hover',
  ol: 'my-5 list-decimal space-y-2 pl-6 marker:tabular marker:text-fg-gray',
  li: 'pl-1.5 text-pretty text-p leading-7 text-foreground/80 [&>p]:my-0',
  strong: 'font-medium text-foreground',
  hr: 'my-10 border-0 border-t border-border',
} as const

function MdxImage({ src, alt, className, ...props }: ComponentPropsWithoutRef<'img'>) {
  return (
    // Content images come from MDX with unknown dimensions, so next/image does not fit here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      decoding="async"
      className={cn(
        'my-8 block h-auto max-w-full rounded-lg outline outline-1 -outline-offset-1 outline-white/10',
        className
      )}
      {...props}
    />
  )
}

function MdxTable({ children }: { children?: ReactNode }) {
  return (
    <div className="my-8 overflow-x-auto overscroll-x-contain border-t border-border">
      <table className="w-full border-collapse text-left text-p-sm">{children}</table>
    </div>
  )
}

function MdxTh({ children }: { children?: ReactNode }) {
  return (
    <th className="min-w-28 border-b border-border py-3 pr-6 align-bottom text-label font-normal text-fg-gray last:pr-0">
      {children}
    </th>
  )
}

function MdxTd({ children }: { children?: ReactNode }) {
  return (
    <td className="tabular min-w-28 border-b border-border py-3 pr-6 align-top text-fg-secondary last:pr-0 [&_strong]:text-foreground">
      {children}
    </td>
  )
}

/** True when a node is nothing but an image (e.g. an image line that markdown turned into a setext heading). */
function isOnlyImage(children: ReactNode) {
  const items = Children.toArray(children).filter((c) => !(typeof c === 'string' && c.trim() === ''))
  return (
    items.length === 1 &&
    isValidElement(items[0]) &&
    (items[0].type === MdxImage || items[0].type === 'img')
  )
}

/**
 * The MDX pipeline has no GFM plugin, so pipe tables would render as raw text.
 * Rewrite them into the table components below before compiling. Cells keep
 * their inline markdown (bold, links, code). Fenced code blocks are left alone.
 */
export function withPipeTables(source: string): string {
  const lines = source.split('\n')
  const out: string[] = []
  const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l)
  const isDivider = (l: string) => /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(l)
  const cells = (l: string) =>
    l
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim().replace(/[{}<>]/g, (ch) => `&#${ch.charCodeAt(0)};`))
  let inFence = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (!inFence && isRow(line) && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const head = cells(line)
      const body: string[][] = []
      i += 2
      while (i < lines.length && isRow(lines[i])) body.push(cells(lines[i++]))
      i--
      out.push(
        '',
        '<MdxTable>',
        '<MdxThead><MdxTr>' + head.map((c) => `<MdxTh>${c}</MdxTh>`).join('') + '</MdxTr></MdxThead>',
        '<MdxTbody>',
        ...body.map((r) => '<MdxTr>' + r.map((c) => `<MdxTd>${c}</MdxTd>`).join('') + '</MdxTr>'),
        '</MdxTbody>',
        '</MdxTable>',
        ''
      )
      continue
    }
    out.push(line)
  }
  return out.join('\n')
}

export function getMDXComponents(): MDXComponents {
  return {
    h1: ({ children }) => <h1 className={reading.h1}>{children}</h1>,
    h2: ({ children }) =>
      isOnlyImage(children) ? <div>{children}</div> : <h2 className={reading.h2}>{children}</h2>,
    h3: ({ children }) => <h3 className={reading.h3}>{children}</h3>,
    p: ({ children }) =>
      isOnlyImage(children) ? <div>{children}</div> : <p className={reading.p}>{children}</p>,
    a: ({ href, children }) => {
      const isExternal = href?.startsWith('http')
      if (isExternal) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className={reading.a}>
            {children}
          </a>
        )
      }
      return (
        <Link href={href ?? '#'} className={reading.a}>
          {children}
        </Link>
      )
    },
    ul: ({ children }) => <ul className={reading.ul}>{children}</ul>,
    ol: ({ children }) => <ol className={reading.ol}>{children}</ol>,
    li: ({ children }) => <li className={reading.li}>{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l border-border-hover pl-5 [&_p]:my-3 [&_p]:text-fg-secondary [&_strong]:text-foreground">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="tabular rounded-sm font-sans bg-surface-3 px-1.5 py-0.5 text-[0.9em] text-foreground">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="tabular my-6 font-sans overflow-x-auto overscroll-x-contain whitespace-pre rounded-xl bg-surface-1 p-4 text-p-sm text-foreground/90 shadow-demo-surface [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[1em]">
        {children}
      </pre>
    ),
    img: MdxImage,
    hr: () => <hr className={reading.hr} />,
    strong: ({ children }) => <strong className={reading.strong}>{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    table: MdxTable,
    th: MdxTh,
    td: MdxTd,
    MdxTable,
    MdxThead: ({ children }: { children?: ReactNode }) => <thead>{children}</thead>,
    MdxTbody: ({ children }: { children?: ReactNode }) => <tbody>{children}</tbody>,
    MdxTr: ({ children }: { children?: ReactNode }) => <tr>{children}</tr>,
    MdxTh,
    MdxTd,
  }
}

import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'

export function getMDXComponents(): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-3xl font-semibold tracking-tight mt-10 mb-4 text-foreground">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3 text-foreground border-b border-border pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold tracking-tight mt-6 mb-2 text-foreground">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-base text-muted-foreground/90 leading-relaxed mb-4">
        {children}
      </p>
    ),
    a: ({ href, children }) => {
      const isExternal = href?.startsWith('http')
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            {children}
          </a>
        )
      }
      return (
        <Link
          href={href ?? '#'}
          className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          {children}
        </Link>
      )
    },
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-1.5 mb-4 text-muted-foreground/90 pl-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-1.5 mb-4 text-muted-foreground/90 pl-2">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/50 pl-4 my-6 italic text-muted-foreground bg-primary/5 py-3 pr-4 rounded-r-lg">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded text-foreground">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto my-6 text-sm font-mono border border-border">
        {children}
      </pre>
    ),
    hr: () => <hr className="border-border my-8" />,
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-muted-foreground">{children}</em>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full text-sm border-collapse border border-border">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-border px-4 py-2 text-left font-semibold bg-muted text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-4 py-2 text-muted-foreground">
        {children}
      </td>
    ),
  }
}

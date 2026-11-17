import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { ManageAnalyticsButton } from '@/components/manage-analytics-button'
import { FooterSignup } from './footer-signup'
import { FooterWordmark } from './footer-wordmark'

const columns = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Articles', href: '/articles' },
      { label: 'FAQ', href: '/#faqs' },
      { label: 'About', href: '/about' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of use', href: '/terms' },
    ],
  },
]

const linkClass =
  'inline-flex min-h-9 items-center rounded-sm text-base text-muted-foreground min-[360px]:whitespace-nowrap transition-colors duration-150 ease-ui hover:text-brand dark:hover:text-foreground'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="px-4 pt-8">
      {/* Brand and signup first, then three link columns: in one row under
          the brand on small screens, beside it on wide ones. All of it sits
          on the same edges as the bottom bar. */}
      <div className="mx-auto grid w-full max-w-shell grid-cols-[repeat(3,auto)] justify-between gap-x-3 gap-y-8 pb-10 sm:grid-cols-3 sm:justify-normal sm:gap-x-6 sm:gap-y-10 sm:pb-12 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] lg:gap-x-12 lg:pb-16">
        <div className="col-span-3 flex flex-col items-start gap-4 lg:col-span-1 lg:max-w-md">
          <Link href="/" aria-label="Vizvest home" className="inline-flex h-10 items-center rounded-md">
            <Logo height={18} />
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            See what your Trading 212 portfolio really earned, from one CSV export.
          </p>
          <FooterSignup />
        </div>

        {columns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="flex h-10 items-center text-sm font-medium">{column.heading}</h2>
            <ul className="flex flex-col">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              {column.heading === 'Legal' ? (
                <li>
                  <ManageAnalyticsButton className={`${linkClass} text-left`} />
                </li>
              ) : null}
            </ul>
          </nav>
        ))}
      </div>

      <p className="mx-auto w-full max-w-shell border-t border-border py-4 text-xs leading-relaxed text-muted-foreground">
        Vizvest is for information only and is not financial, investment or tax advice. Figures are worked out from
        your export and may contain errors, so check them against your official Trading&nbsp;212 statements. Do not
        use Vizvest for tax purposes: always consult a qualified tax adviser. Vizvest is not affiliated with
        Trading&nbsp;212. See the{' '}
        <Link href="/terms" className="underline decoration-muted-foreground/40 underline-offset-2 transition-colors duration-150 ease-ui hover:text-foreground">
          terms of use
        </Link>
        .
      </p>

      <div className="mx-auto flex w-full max-w-shell items-center justify-between gap-4 border-t border-border py-4">
        <div className="flex flex-col gap-x-6 gap-y-1 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">&copy; {currentYear} Vizvest. All rights reserved.</p>
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden="true" className="ml-[3px] size-1.5 rounded-full bg-up shadow-[0_0_0_3px_hsl(var(--up)/0.18)]" />
            Runs entirely in your browser
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-shell pb-4 pt-6 sm:pb-6 sm:pt-10 lg:pt-14">
        <FooterWordmark className="text-foreground/10" />
      </div>
    </footer>
  )
}

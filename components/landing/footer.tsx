import Link from 'next/link'
import { FooterSignup } from './footer-signup'
import { ManageAnalyticsButton } from '@/components/manage-analytics-button'
import { Container } from '@/components/layout/container'
import { Wordmark } from '@/components/layout/wordmark'

const footerLinks = [
  {
    heading: 'Product',
    label: 'Product links',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    heading: 'Resources',
    label: 'Resources links',
    links: [
      { label: 'Articles', href: '/articles' },
      { label: 'FAQ', href: '/#faqs' },
    ],
  },
  {
    heading: 'Legal',
    label: 'Legal links',
    links: [{ label: 'Privacy policy', href: '/privacy' }],
  },
]

const LINK = 'rounded-sm text-p-sm text-fg-gray transition-colors duration-200 ease-out hover:text-white'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background" role="contentinfo">
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 px-6 md:grid-cols-3 md:gap-12 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="col-span-2 flex flex-col gap-6 md:col-span-3 lg:col-span-1">
            <Link href="/" aria-label="Vizvest home" className="w-fit rounded-sm transition-opacity duration-200 hover:opacity-70">
              <Wordmark />
            </Link>
            <p className="max-w-[320px] text-pretty text-p-sm text-fg-gray">
              Visualize and analyze your Trading 212 portfolio with powerful insights and interactive charts.
            </p>
            <FooterSignup />
          </div>

          {footerLinks.map((col) => (
            <nav key={col.heading} aria-label={col.label}>
              <h2 className="mb-4 text-p-sm text-white">{col.heading}</h2>
              <ul className="flex flex-col gap-3" role="list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                {col.heading === 'Legal' ? (
                  <li>
                    <ManageAnalyticsButton className={`${LINK} text-left`} />
                  </li>
                ) : null}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-border px-6 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-p-sm text-fg-gray">&copy; {currentYear} Vizvest. All rights reserved.</p>
          <p className="inline-flex items-center gap-2 text-p-sm text-positive">
            <span className="status-dot" aria-hidden="true" />
            Runs entirely in your browser
          </p>
        </div>
      </Container>
    </footer>
  )
}

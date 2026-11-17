import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { ManageAnalyticsButton } from '@/components/manage-analytics-button'
import { FooterSignup } from './footer-signup'

const footerLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/#faqs' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Articles', href: '/articles' },
  { label: 'Privacy policy', href: '/privacy' },
]

const linkClass =
  'inline-flex min-h-9 items-center rounded-sm text-base text-muted-foreground transition-colors duration-150 ease-ui hover:text-brand dark:hover:text-foreground'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="px-4 pt-8">
      {/* Brand and links on the left, signup on the right, on the same edges
          as the bottom bar. The last rows of each side share a baseline. */}
      <div className="mx-auto grid w-full max-w-shell gap-10 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-end lg:gap-16 lg:pb-16">
        <div className="flex flex-col items-start gap-4">
          <Link href="/" aria-label="Vizvest home" className="inline-flex h-10 items-center rounded-md">
            <Logo height={18} />
          </Link>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <ManageAnalyticsButton className={linkClass} />
              </li>
            </ul>
          </nav>
        </div>

        <FooterSignup />
      </div>

      <div className="mx-auto flex w-full max-w-shell items-center justify-between gap-4 border-t border-border py-4">
        <p className="text-sm text-muted-foreground">&copy; {currentYear} Vizvest. All rights reserved.</p>
        <ThemeToggle />
      </div>
    </footer>
  )
}

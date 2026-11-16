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
  'rounded-sm text-base text-muted-foreground transition-colors duration-300 ease-ui hover:text-brand dark:hover:text-foreground'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="px-4 pt-8">
      <div className="mx-auto flex w-full max-w-shell flex-col items-center gap-8 pb-16 text-center">
        <Link href="/" aria-label="Vizvest home" className="rounded-md">
          <Logo height={18} />
        </Link>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
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

        <FooterSignup />
      </div>

      <div className="mx-auto flex w-full max-w-shell items-center justify-between gap-4 border-t border-border py-4">
        <p className="text-sm text-muted-foreground">&copy; {currentYear} Vizvest. All rights reserved.</p>
        <ThemeToggle />
      </div>
    </footer>
  )
}

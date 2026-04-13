'use client'

import Link from 'next/link'
import Image from 'next/image'

const footerLinks = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  resources: [
    { label: 'Articles', href: '/articles' },
    { label: 'FAQ', href: '/#faqs' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 bg-muted/30 dark:bg-background" role="contentinfo">
      <div className="container mx-auto px-6 py-12 lg:py-16">
        {/* Link columns */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 lg:gap-16">
          {/* Brand */}
          <div className="md:max-w-xs">
            <Link
              href="/"
              className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
              aria-label="Vizvest home"
            >
              <Image
                src="/assets/logo-full-light-nobg.png"
                alt="Vizvest"
                width={150}
                height={34}
                className="h-16 w-auto dark:hidden"
              />
              <Image
                src="/assets/logo-full-dark-nobg.png"
                alt="Vizvest"
                width={150}
                height={34}
                className="hidden h-16 w-auto dark:block"
              />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Visualize and analyze your Trading 212 portfolio with powerful insights and interactive charts
            </p>
          </div>

          {/* Right cluster: nav columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 lg:gap-20">
          {/* Product */}
          <nav aria-label="Product links">
            <h3 className="text-[11px] font-mono font-medium uppercase tracking-[1.5px] text-muted-foreground mb-5">
              Product
            </h3>
            <ul className="space-y-3" role="list">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources links">
            <h3 className="text-[11px] font-mono font-medium uppercase tracking-[1.5px] text-muted-foreground mb-5">
              Resources
            </h3>
            <ul className="space-y-3" role="list">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal links">
            <h3 className="text-[11px] font-mono font-medium uppercase tracking-[1.5px] text-muted-foreground mb-5">
              Legal
            </h3>
            <ul className="space-y-3" role="list">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="mt-12 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Vizvest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

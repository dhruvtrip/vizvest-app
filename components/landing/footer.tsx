'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Articles', href: '/articles' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Trading 212 Guide', href: '#' },
  ],
  legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 bg-muted/30 dark:bg-background" role="contentinfo">
      <div className="container mx-auto px-6 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
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
                className="h-20 w-auto dark:hidden"
              />
              <Image
                src="/assets/logo-full-dark-nobg.png"
                alt="Vizvest"
                width={150}
                height={34}
                className="hidden h-20 w-auto dark:block"
              />
            </Link>
            <p className="mt-4 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Visualize and analyze your Trading 212 portfolio with powerful insights and interactive charts.
            </p>
          </div>

          {/* Product */}
          <nav aria-label="Product links">
            <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-4">Product</h3>
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

          {/* Legal */}
          <nav aria-label="Legal links">
            <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-4">Legal</h3>
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

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Vizvest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

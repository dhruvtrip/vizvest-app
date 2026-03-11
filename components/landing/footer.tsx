'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Github, Twitter } from 'lucide-react'

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

const socialLinks = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
]

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
              Visualize and analyze your Trading 212 portfolio with powerful insights and beautiful charts.
            </p>
            {/* Social Links */}
            <nav aria-label="Social media links" className="flex items-center gap-2 mt-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={`Visit our ${social.label} page`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="w-4 h-4" aria-hidden="true" />
                </motion.a>
              ))}
            </nav>
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

          {/* Resources */}
          <nav aria-label="Resources links">
            <h3 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-4">Resources</h3>
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

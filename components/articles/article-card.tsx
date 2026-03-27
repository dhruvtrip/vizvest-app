'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, ArrowUpRight } from 'lucide-react'
import type { ArticleMeta } from '@/types/article'

interface ArticleCardProps {
  article: ArticleMeta
  index: number
}

export function ArticleCard({ article, index }: ArticleCardProps) {
  const formattedDate = new Date(article.date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/articles/${article.slug}`} className="group block h-full">
        <article className="relative h-full flex flex-col border border-border rounded-xl bg-card hover:border-primary/40 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_32px_rgba(120,119,198,0.08)] overflow-hidden">

          {/* Top accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="flex flex-col flex-1 p-6">
            {/* Meta row */}
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-muted-foreground/60 tracking-widest uppercase">
                {formattedDate}
              </span>
              <div className="flex items-center gap-1 text-muted-foreground/50">
                <Clock className="w-3 h-3" />
                <span className="font-mono text-xs">{article.readingTime}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border mb-5" />

            {/* Title */}
            <h2 className="text-lg font-semibold tracking-tight text-foreground leading-snug mb-3 group-hover:text-primary transition-colors duration-200">
              {article.title}
            </h2>

            {/* Description */}
            <p className="text-sm text-muted-foreground/70 leading-relaxed line-clamp-3 flex-1">
              {article.description}
            </p>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-border text-muted-foreground/60 bg-muted/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Read arrow */}
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface RotatingTextProps {
  words: string[]
  interval?: number
  className?: string
  gradientColors?: [string, string]
  pauseOnHover?: boolean
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
}

export function RotatingText({
  words,
  interval,
  className,
  gradientColors = ['#3b82f6', '#8b5cf6'],
  pauseOnHover = true,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000
}: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Find the longest word to set min-width
  const longestWord = words.reduce((a, b) => (a.length > b.length ? a : b), '')

  useEffect(() => {
    if (isPaused) return

    const currentWord = words[currentIndex]
    const speed = isDeleting ? deletingSpeed : typingSpeed

    if (!isDeleting && currentText === currentWord) {
      // Word is complete, pause then start deleting
      timeoutRef.current = setTimeout(() => {
        setIsDeleting(true)
      }, pauseDuration)
      return
    }

    if (isDeleting && currentText === '') {
      // Word is deleted, move to next word
      setIsDeleting(false)
      setCurrentIndex((prev) => (prev + 1) % words.length)
      return
    }

    timeoutRef.current = setTimeout(() => {
      if (isDeleting) {
        setCurrentText((prev) => prev.slice(0, -1))
      } else {
        setCurrentText((prev) => currentWord.slice(0, prev.length + 1))
      }
    }, speed)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [currentText, isDeleting, currentIndex, words, typingSpeed, deletingSpeed, pauseDuration, isPaused])

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true)
    }
  }

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false)
    }
  }

  // Use solid blue color
  const textColor = gradientColors[0] || '#3b82f6'

  const cursorVariants = {
    blinking: {
      opacity: [1, 1, 0, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
        repeatDelay: 0,
        ease: 'linear'
      }
    }
  }

  return (
    <span
      className={cn('inline-block relative', className)}
      style={{
        minWidth: `${longestWord.length * 0.6}ch`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        className="inline-block"
        style={{
          color: textColor
        }}
      >
        {currentText}
      </span>
      <motion.span
        variants={cursorVariants}
        animate="blinking"
        className="inline-block ml-1"
        style={{
          width: '2px',
          height: '1em',
          background: textColor,
          verticalAlign: 'baseline'
        }}
        aria-hidden="true"
      />
    </span>
  )
}

'use client'

import { useState, useEffect } from 'react'
import posthog from 'posthog-js'
import { CheckCircle2, Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STORAGE_KEY = 'vizvest_signup_dismissed'
type Status = 'idle' | 'loading' | 'success' | 'error'

export function EmailSignupDialog({ show }: { show: boolean }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (!show) return
    if (localStorage.getItem(STORAGE_KEY)) return
    setOpen(true)
    posthog.capture('signup_dialog_shown')
  }, [show])

  useEffect(() => {
    if (status !== 'success') return
    const timer = setTimeout(() => setOpen(false), 2500)
    return () => clearTimeout(timer)
  }, [status])

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      localStorage.setItem(STORAGE_KEY, 'true')
      posthog.capture('signup_dialog_dismissed')
    }
    setOpen(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    posthog.capture('signup_dialog_submitted')
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setStatus('success')
      posthog.capture('signup_dialog_success')
    } else {
      setStatus('error')
      posthog.capture('signup_dialog_error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 sm:max-w-[440px]">
        <span
          className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-foreground shadow-demo-surface"
          aria-hidden="true"
        >
          <Mail className="h-4 w-4" strokeWidth={1.5} />
        </span>

        <DialogTitle className="mt-5 text-h4">Be first to know</DialogTitle>
        <DialogDescription className="mt-2 text-pretty text-p-sm text-fg-secondary">
          New features, portfolio insights and updates, delivered to your inbox.
        </DialogDescription>

        {status === 'success' ? (
          <div className="mt-6 flex h-10 items-center gap-2" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-p-sm text-foreground">
              You&apos;re on the list.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="your@email.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                autoFocus
                className="sm:flex-1"
              />
              <Button
                type="submit"
                size="lg"
                disabled={status === 'loading'}
                className="sm:shrink-0"
              >
                {status === 'loading' ? 'Subscribing…' : 'Notify me'}
              </Button>
            </div>
            {status === 'error' && (
              <p className="text-p-sm text-negative" role="alert">
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect } from 'react'
import posthog from 'posthog-js'
import { CheckCircle2 } from 'lucide-react'
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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="h-[2px] bg-[hsl(var(--brand))]" />

        <div className="px-8 pt-8 pb-10">
          <div className="mb-8">
            <p className="label-uppercase-sm text-[hsl(var(--brand))] mb-4">
              Vizvest Updates
            </p>
            <DialogTitle className="font-heading text-[2rem] font-light tracking-[-0.025em] leading-[1.15] text-foreground mb-3">
              Be first to know
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              New features, portfolio insights, and updates - delivered to your inbox.
            </DialogDescription>
          </div>

          {status === 'success' ? (
            <div className="flex items-center gap-3 py-2">
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-[hsl(var(--brand))]"
              />
              <p className="text-sm font-medium text-foreground">
                You&apos;re on the list.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                autoFocus
                className="h-11"
              />
              {status === 'error' && (
                <p className="text-xs text-destructive">
                  Something went wrong. Please try again.
                </p>
              )}
              <Button
                type="submit"
                disabled={status === 'loading'}
                className="w-full h-11 bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand))]/90 font-medium cursor-pointer"
              >
                {status === 'loading' ? 'Subscribing…' : 'Notify me'}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

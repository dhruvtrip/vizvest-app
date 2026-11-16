'use client'

import { useState, useEffect } from 'react'
import posthog from 'posthog-js'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SuccessCheck, useShake } from '@/components/motion'

const STORAGE_KEY = 'vizvest_signup_dismissed'
type Status = 'idle' | 'loading' | 'success' | 'error'

export function EmailSignupDialog({ show }: { show: boolean }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const { ref: formRef, shake } = useShake<HTMLFormElement>()

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

  // A failed signup shakes the form; the error line below says what happened.
  useEffect(() => {
    if (status === 'error') shake()
  }, [status, shake])

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
      <DialogContent className="sm:max-w-md">
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center" role="status">
            <span className="grid size-14 place-items-center rounded-full bg-tile text-foreground">
              <SuccessCheck size={28} />
            </span>
            <div className="space-y-1">
              <DialogTitle>You&apos;re on the list</DialogTitle>
              <DialogDescription>
                We&apos;ll email you when there is something new in Vizvest.
              </DialogDescription>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Get Vizvest updates</DialogTitle>
              <DialogDescription>
                An occasional email about new features and portfolio insights.
              </DialogDescription>
            </DialogHeader>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="signup-email">Email address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === 'loading'}
                  autoFocus
                  aria-invalid={status === 'error' || undefined}
                  aria-describedby={status === 'error' ? 'signup-error' : undefined}
                />
              </div>
              {status === 'error' && (
                <p id="signup-error" role="alert" className="text-sm font-normal text-destructive">
                  That did not go through. Check the address and try again.
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={status === 'loading'}
                className="w-full"
              >
                {status === 'loading' ? 'Subscribing…' : 'Notify me'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

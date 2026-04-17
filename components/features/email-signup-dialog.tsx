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

const STORAGE_KEY = 'vizvest_signup_dismissed'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface EmailSignupDialogProps {
  show: boolean
}

export function EmailSignupDialog({ show }: EmailSignupDialogProps) {
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
    const timer = setTimeout(() => setOpen(false), 2000)
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stay in the loop</DialogTitle>
          <DialogDescription>
            Get notified when we ship new features and improvements to Vizvest.
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <p className="text-sm text-center py-2 text-emerald-600 dark:text-emerald-400 font-medium">
            You&apos;re in!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-1">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === 'loading'}
              autoFocus
            />
            {status === 'error' && (
              <p className="text-xs text-destructive">
                Something went wrong. Please try again.
              </p>
            )}
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { AutoHeight } from './auto-height'
import { readCssMs } from './css-time'

export interface PanelSwapProps {
  /** Changing the key swaps the content. */
  activeKey: string
  children: React.ReactNode
  className?: string
}

interface Entry {
  key: string
  node: React.ReactNode
}

/**
 * Cross-blurs from the old content to the new when `activeKey` changes
 * (transitions.dev "Panel reveal", with a short travel), while the height
 * follows smoothly (`AutoHeight`). The old content stays on screen, inert,
 * until it has faded. Nothing animates on the first render. Switching back
 * mid-swap reverses in place.
 */
export function PanelSwap({ activeKey, children, className }: PanelSwapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  // Last committed key and content, so the outgoing panel keeps what it showed.
  const committed = useRef<Entry>({ key: activeKey, node: children })
  const [shownKey, setShownKey] = useState(activeKey)
  const [exiting, setExiting] = useState<Entry | null>(null)
  // Key of a freshly mounted panel that is rendered closed for one commit.
  const [entering, setEntering] = useState<string | null>(null)

  if (shownKey !== activeKey) {
    setShownKey(activeKey)
    // Read once, at the swap: the content the outgoing panel last showed.
    // eslint-disable-next-line react-hooks/refs -- intentional one-off read at the key swap; the ref holds the last committed panel, which must not drive renders
    setExiting(committed.current)
    // A panel that was on its way out is reused as is and simply transitions
    // back open; a new one mounts closed and opens after a reflow.
    setEntering(exiting !== null && exiting.key === activeKey ? null : activeKey)
  }

  useLayoutEffect(() => {
    committed.current = { key: activeKey, node: children }
  })

  useLayoutEffect(() => {
    if (entering === null) return
    void activeRef.current?.offsetWidth // force reflow so the open transitions
    setEntering(null)
  }, [entering])

  // Drop the outgoing panel once it has faded.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!exiting || !el) return
    const timer = window.setTimeout(() => setExiting(null), readCssMs(el, '--panel-close-dur', 350) + 20)
    return () => window.clearTimeout(timer)
  }, [exiting])

  const showExiting = exiting !== null && exiting.key !== activeKey

  return (
    <AutoHeight className={className}>
      <div ref={containerRef} className={cn('t-panel-swap relative', showExiting && 'overflow-hidden')}>
        {showExiting ? (
          <div
            key={exiting.key}
            className="t-panel-slide absolute inset-x-0 top-0"
            data-open="false"
            aria-hidden="true"
            inert
          >
            {exiting.node}
          </div>
        ) : null}
        <div
          key={activeKey}
          ref={activeRef}
          className="t-panel-slide"
          data-open={entering === activeKey ? 'false' : 'true'}
        >
          {children}
        </div>
      </div>
    </AutoHeight>
  )
}

'use client'

import { formatBytes } from '@/lib/helpers/formatBytes/formatBytes'
import { formatDuration } from '@/lib/helpers/formatDuration/formatDuration'
import { usePregenStore } from '@/store/usePregenStore'
import { Button } from '@carbonid1/design-system'
import { Download, Pause, Play, Trash2, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type BookCardMenuTarget = {
  x: number
  y: number
  bookId: string
}

type BookCardContextMenuProps = {
  target: BookCardMenuTarget | null
  onRemove: (bookId: string) => void
  onClose: () => void
}

export const BookCardContextMenu = ({ target, onRemove, onClose }: BookCardContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const bookId = target?.bookId
  const job = usePregenStore(s => (bookId ? s.jobs[bookId] : undefined))
  const estimate = usePregenStore(s => (bookId ? s.estimates[bookId] : undefined))

  useLayoutEffect(() => {
    if (!target || !menuRef.current) return
    const menu = menuRef.current
    const left = Math.min(target.x, window.innerWidth - menu.offsetWidth - 8)
    const top = Math.min(target.y, window.innerHeight - menu.offsetHeight - 8)
    setPosition({ left: Math.max(8, left), top: Math.max(8, top) })
  }, [target])

  useEffect(() => {
    if (!target) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [target, onClose])

  if (!target) return null

  const handleStart = async () => {
    const response = await fetch(`/api/pregenerate/${target.bookId}`, { method: 'POST' })
    if (response.ok) {
      const newJob = await response.json()
      usePregenStore.getState().updateJob(newJob)
    }
    onClose()
  }

  const handlePause = async () => {
    await fetch(`/api/pregenerate/${target.bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' }),
    })
    onClose()
  }

  const handleResume = async () => {
    await fetch(`/api/pregenerate/${target.bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resume' }),
    })
    onClose()
  }

  const handleCancel = async () => {
    await fetch(`/api/pregenerate/${target.bookId}`, { method: 'DELETE' })
    onClose()
  }

  const handleRemove = () => {
    onRemove(target.bookId)
    onClose()
  }

  const isFullyCached =
    estimate &&
    estimate.cachedParagraphs >= estimate.totalParagraphs &&
    estimate.totalParagraphs > 0
  const showPregenItem = !job && !isFullyCached
  const hasCachedContent = estimate && estimate.cachedParagraphs > 0

  const estimateLabel =
    estimate && showPregenItem
      ? `~${formatBytes(estimate.estimatedSizeBytes)} · ~${formatDuration(estimate.estimatedGenerationMinutes * 60_000)}`
      : null

  return (
    <div
      ref={menuRef}
      style={{ left: position.left, top: position.top }}
      className="border-border bg-background fixed z-50 min-w-52 rounded-lg border py-1 shadow-lg"
      role="menu"
    >
      {showPregenItem && (
        <div>
          <Button role="menuitem" size="small" fullWidth onClick={handleStart}>
            <Download />
            {hasCachedContent ? 'Resume Generation' : 'Pre-generate Audio'}
          </Button>
          {estimateLabel && (
            <p className="text-muted-foreground px-3 pb-1 text-xs">{estimateLabel}</p>
          )}
        </div>
      )}

      {job?.status === 'in_progress' && (
        <Button role="menuitem" size="small" fullWidth onClick={handlePause}>
          <Pause />
          Pause Generation
        </Button>
      )}

      {job?.status === 'paused' && (
        <Button role="menuitem" size="small" fullWidth onClick={handleResume}>
          <Play />
          Resume Generation
        </Button>
      )}

      {job && job.status !== 'completed' && (
        <Button role="menuitem" size="small" fullWidth onClick={handleCancel}>
          <X />
          Cancel Generation
        </Button>
      )}

      <div className="border-border my-1 border-t" />

      <Button role="menuitem" size="small" fullWidth onClick={handleRemove}>
        <Trash2 />
        Remove Book
      </Button>
    </div>
  )
}

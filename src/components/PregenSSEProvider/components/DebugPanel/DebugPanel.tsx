'use client'

import { Badge, type BadgeProps } from '@carbonid1/design-system'
import { X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { formatDuration } from '@/lib/helpers/formatDuration/formatDuration'
import { useTTSLifecycleStore } from '@/lib/hooks/useTTSLifecycle/useTTSLifecycle'
import type { PregenJobStatus } from '@/lib/services/pregenQueue/pregenQueue.types'
import type { LifecycleState } from '@/lib/services/pythonClient/pythonClient.types'
import { useLibraryStore } from '@/store/useLibraryStore'
import { usePregenStore } from '@/store/usePregenStore'

interface StatusBadge {
  label: string
  variant: BadgeProps['variant']
}

const STATUS_BADGES: Record<PregenJobStatus, StatusBadge> = {
  queued: { label: 'Queued', variant: 'default' },
  in_progress: { label: 'Generating', variant: 'primary' },
  paused: { label: 'Paused', variant: 'attention' },
  completed: { label: 'Completed', variant: 'success' },
}

const WARMING_UP_BADGE: StatusBadge = { label: 'Warming up', variant: 'highlight' }

const TTS_LIFECYCLE_BADGES: Record<LifecycleState, StatusBadge> = {
  stopped: { label: 'Idle', variant: 'default' },
  starting: { label: 'Starting', variant: 'attention' },
  ready: { label: 'Ready', variant: 'success' },
  stopping: { label: 'Stopping', variant: 'attention' },
}

export const DebugPanel = () => {
  const [open, setOpen] = useState(false)
  const jobs = usePregenStore(s => s.jobs)
  const samplingRates = usePregenStore(s => s.samplingRates)
  const warmingUpBookId = usePregenStore(s => s.warmingUpBookId)
  const books = useLibraryStore(s => s.books)
  const ttsLifecycleState = useTTSLifecycleStore(s => s.state)
  const ttsBadge = TTS_LIFECYCLE_BADGES[ttsLifecycleState]

  const toggle = useCallback(() => setOpen(prev => !prev), [])

  useHotkeys('d', toggle)

  const bookTitles = useMemo(() => {
    const map: Record<string, string> = {}

    for (const book of books) {
      map[book.id] = book.title
    }
    return map
  }, [books])

  const jobList = useMemo(() => Object.values(jobs), [jobs])

  if (!open) return null

  return (
    <div className="fixed right-4 bottom-4 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-neutral-300 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Generation Queue</h2>
          <Badge variant={ttsBadge.variant}>TTS · {ttsBadge.label}</Badge>
        </div>
        <button
          onClick={toggle}
          className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto p-2">
        {jobList.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-500">No generation jobs</p>
        ) : (
          <div className="space-y-1">
            {jobList.map(job => {
              const status =
                warmingUpBookId === job.bookId ? WARMING_UP_BADGE : STATUS_BADGES[job.status]

              return (
                <div
                  key={job.id}
                  className="rounded-md bg-neutral-50 px-3 py-2 dark:bg-neutral-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-medium">
                      {bookTitles[job.bookId] ?? job.bookId}
                    </span>
                    <Badge variant={status.variant} className="shrink-0">
                      {status.label}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>
                      {job.completedParagraphs} / {job.totalParagraphs}
                      {job.generatedDurationMs > 0 &&
                        ` · ${formatDuration(job.generatedDurationMs)}`}
                      {job.status === 'in_progress' &&
                        samplingRates[job.bookId] != null &&
                        ` · ${samplingRates[job.bookId]?.toFixed(1)} it/s`}
                    </span>
                    {job.errorMessage && (
                      <span className="text-destructive truncate">{job.errorMessage}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

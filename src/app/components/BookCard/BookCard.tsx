'use client'

import { computeProgressPercent } from '@/lib/helpers/computeProgressPercent/computeProgressPercent'
import { formatDuration } from '@/lib/helpers/formatDuration/formatDuration'
import { formatTimeAgo } from '@/lib/helpers/formatTimeAgo/formatTimeAgo'
import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import type { Book } from '@/lib/types/book'
import { usePregenStore } from '@/store/usePregenStore'
import { useProgressStore } from '@/store/useProgressStore'
import { ProgressRing, Tooltip } from '@carbonid1/design-system'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import type { MouseEvent } from 'react'
import { useState } from 'react'

type BookCardProps = {
  book: Book
  onContextMenu: (e: MouseEvent, bookId: string) => void
}

const getPregenRingColor = (job: PregenJob): string => {
  if (job.status === 'completed') return 'text-success'
  if (job.status === 'in_progress') return 'text-primary'
  return 'text-muted-foreground'
}

const getPregenRingLabel = (job: PregenJob): string => {
  if (job.status === 'queued') return 'Queued'

  const duration = formatDuration(job.generatedDurationMs)
  const paragraphs =
    job.status === 'completed'
      ? `${job.totalParagraphs} paragraphs`
      : `${job.completedParagraphs} of ${job.totalParagraphs} paragraphs`

  return duration ? `${paragraphs} · ${duration}` : paragraphs
}

export const BookCard = ({ book, onContextMenu }: BookCardProps) => {
  const [coverLoaded, setCoverLoaded] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const progress = useProgressStore(state => state.progress[book.id])
  const progressPercent = computeProgressPercent(progress)
  const isFinished = progressPercent !== null && progressPercent >= 99
  const job = usePregenStore(s => s.jobs[book.id])

  const ringLabel = job ? getPregenRingLabel(job) : ''

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(e, book.id)
  }

  return (
    <Link href={`/book/${book.id}`}>
      <div
        className="group border-border bg-background hover:border-primary-border relative flex h-full flex-col rounded-lg border p-4 transition-all hover:shadow-md"
        onContextMenu={handleContextMenu}
      >
        <div className="bg-muted relative mb-3 flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-sm">
          {!coverError ? (
            <>
              {!coverLoaded && (
                <div className="bg-muted absolute inset-0 animate-pulse" aria-hidden="true" />
              )}
              <img
                src={`/api/book/${book.id}/cover`}
                alt={`Cover of ${book.title}`}
                loading="lazy"
                className={`h-full w-full object-cover ${coverLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={e => {
                  const img = e.target as HTMLImageElement
                  if (img.naturalWidth === 0) {
                    setCoverError(true)
                  } else {
                    setCoverLoaded(true)
                  }
                }}
                onError={() => setCoverError(true)}
              />
            </>
          ) : (
            <BookOpen className="text-muted-foreground size-12" />
          )}
          {/* Progress bar at bottom of cover */}
          {progressPercent !== null && (
            <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-black/20" aria-hidden="true">
              <div
                className={`h-full ${isFinished ? 'bg-success' : 'bg-primary'}`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
              <span className="sr-only">{progressPercent}% complete</span>
            </div>
          )}
        </div>
        <h3 className="text-foreground mb-1 line-clamp-2 font-medium">{book.title}</h3>
        <p className="text-muted-foreground line-clamp-2 text-sm" title={book.author}>
          {book.author}
        </p>
        <div className="mt-1 flex min-h-[1.25rem] items-center gap-1.5">
          {job && (
            <Tooltip label={ringLabel} delay={600}>
              <div className="flex shrink-0 items-center">
                <ProgressRing
                  progress={
                    job.totalParagraphs > 0 ? job.completedParagraphs / job.totalParagraphs : 0
                  }
                  colorClass={getPregenRingColor(job)}
                  label={ringLabel}
                  animate={job.status === 'in_progress'}
                  pendingStyle={
                    job.status !== 'in_progress' && job.status !== 'completed' ? 'dashed' : 'none'
                  }
                />
              </div>
            </Tooltip>
          )}
          {isFinished ? (
            <p className="text-success-foreground text-xs">Finished</p>
          ) : progress?.lastReadAt ? (
            <p className="text-muted-foreground text-xs">
              Last read {formatTimeAgo(progress.lastReadAt)}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

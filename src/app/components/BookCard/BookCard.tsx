'use client'

import { computeProgressPercent } from '@/lib/helpers/computeProgressPercent/computeProgressPercent'
import { formatTimeAgo } from '@/lib/helpers/formatTimeAgo/formatTimeAgo'
import type { Book } from '@/lib/types/book'
import { useProgressStore } from '@/store/useProgressStore'
import { BookOpen, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type BookCardProps = {
  book: Book
  onRemove?: () => void
}

export const BookCard = ({ book, onRemove }: BookCardProps) => {
  const [coverLoaded, setCoverLoaded] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const progress = useProgressStore(state => state.progress[book.id])
  const progressPercent = computeProgressPercent(progress)
  const isFinished = progressPercent !== null && progressPercent >= 99

  return (
    <Link href={`/book/${book.id}`}>
      <div className="group h-full flex flex-col p-4 border border-border rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all bg-background relative">
        {onRemove && (
          <button
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity hover:bg-black/80"
            aria-label={`Remove ${book.title}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="w-full aspect-[2/3] bg-muted rounded mb-3 flex items-center justify-center overflow-hidden relative">
          {!coverError ? (
            <>
              {!coverLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" aria-hidden="true" />
              )}
              <img
                src={`/api/book/${book.id}/cover`}
                alt={`Cover of ${book.title}`}
                loading="lazy"
                className={`w-full h-full object-cover ${coverLoaded ? 'opacity-100' : 'opacity-0'}`}
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
            <BookOpen className="w-12 h-12 text-muted-foreground" />
          )}
          {/* Progress bar at bottom of cover */}
          {progressPercent !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20" aria-hidden="true">
              <div
                className={`h-full ${isFinished ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
              <span className="sr-only">{progressPercent}% complete</span>
            </div>
          )}
        </div>
        <h3 className="font-medium text-foreground line-clamp-2 mb-1">{book.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
        <div className="min-h-[1.25rem] mt-1">
          {isFinished ? (
            <p className="text-xs text-green-500">Finished</p>
          ) : progress?.lastReadAt ? (
            <p className="text-xs text-gray-400">Last read {formatTimeAgo(progress.lastReadAt)}</p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

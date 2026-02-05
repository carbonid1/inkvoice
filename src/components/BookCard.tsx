'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Book, useStore } from '@/store/useStore'
import { formatTimeAgo } from '@/lib/helpers/formatTimeAgo/formatTimeAgo'
import { computeProgressPercent } from '@/lib/helpers/computeProgressPercent/computeProgressPercent'
import { BookIcon } from '@/components/icons/BookIcon'

interface BookCardProps {
  book: Book
}

export const BookCard = ({ book }: BookCardProps) => {
  const [coverLoaded, setCoverLoaded] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const progress = useStore((state) => state.progress[book.id])
  const progressPercent = computeProgressPercent(progress)
  const isFinished = progressPercent !== null && progressPercent >= 99

  return (
    <Link href={`/book/${book.id}`}>
      <div className="h-full flex flex-col p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer bg-white dark:bg-gray-800">
        <div className="w-full aspect-[2/3] bg-gray-100 dark:bg-gray-700 rounded mb-3 flex items-center justify-center overflow-hidden relative">
          {!coverError ? (
            <>
              {!coverLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 animate-pulse" />
              )}
              <img
                src={`/api/book/${book.id}/cover`}
                alt={`Cover of ${book.title}`}
                loading="lazy"
                className={`w-full h-full object-cover ${coverLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={(e) => {
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
            <BookIcon />
          )}
          {/* Progress bar at bottom of cover */}
          {progressPercent !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20">
              <div
                className={`h-full ${isFinished ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          )}
        </div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
          {book.author}
        </p>
        <div className="min-h-[1.25rem] mt-1">
          {isFinished ? (
            <p className="text-xs text-green-500">Finished</p>
          ) : progress?.lastReadAt ? (
            <p className="text-xs text-gray-400">
              Last read {formatTimeAgo(progress.lastReadAt)}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

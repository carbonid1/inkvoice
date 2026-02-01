'use client'

import Link from 'next/link'
import { Book } from '@/store/useStore'

interface BookCardProps {
  book: Book
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/book/${book.id}`}>
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer bg-white dark:bg-gray-800">
        <div className="w-full aspect-[2/3] bg-gray-100 dark:bg-gray-700 rounded mb-3 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
          {book.author}
        </p>
      </div>
    </Link>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookCard } from '@/components/BookCard'
import { Book, useStore } from '@/store/useStore'

export default function Library() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { books, setBooks } = useStore()

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch('/api/books')
        if (!response.ok) {
          throw new Error('Failed to fetch books')
        }
        const data: Book[] = await response.json()
        setBooks(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [setBooks])

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">InkVoice</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your local audiobook reader
            </p>
          </div>
          <Link
            href="/settings"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Settings"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {loading && (
          <div className="text-center py-12 text-gray-500">Loading books...</div>
        )}

        {error && (
          <div className="text-center py-12 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No books found
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Add .epub files to <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">data/books/</code> to get started
            </p>
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

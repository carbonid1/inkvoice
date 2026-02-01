'use client'

import { useEffect, useState } from 'react'
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
        <h1 className="text-3xl font-bold">InkVoice</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Your local audiobook reader
        </p>
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

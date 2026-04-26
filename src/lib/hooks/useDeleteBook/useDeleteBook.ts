'use client'

import { useCallback, useMemo } from 'react'

interface DeleteBookState {
  deleteBook: (id: string) => Promise<boolean>
  restoreBook: (id: string) => Promise<boolean>
}

export const useDeleteBook = (): DeleteBookState => {
  const deleteBook = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/books/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })

      return response.ok
    } catch {
      return false
    }
  }, [])

  const restoreBook = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/books/${encodeURIComponent(id)}`, {
        method: 'PATCH',
      })

      return response.ok
    } catch {
      return false
    }
  }, [])

  return useMemo(() => ({ deleteBook, restoreBook }), [deleteBook, restoreBook])
}

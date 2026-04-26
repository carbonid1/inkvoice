'use client'

import { useCallback, useMemo, useState } from 'react'

interface SavedPosition {
  chapter: number
  paragraph: number
}

interface UseReturnPositionResult {
  savedPosition: SavedPosition | null
  savePosition: (chapter: number, paragraph: number) => void
  clearPosition: () => void
  navigateBack: (onNavigate: (chapter: number, paragraph: number) => void) => void
}

export const useReturnPosition = (): UseReturnPositionResult => {
  const [savedPosition, setSavedPosition] = useState<SavedPosition | null>(null)

  const savePosition = useCallback((chapter: number, paragraph: number) => {
    setSavedPosition(prev => prev ?? { chapter, paragraph })
  }, [])

  const clearPosition = useCallback(() => {
    setSavedPosition(null)
  }, [])

  const navigateBack = useCallback((onNavigate: (chapter: number, paragraph: number) => void) => {
    setSavedPosition(prev => {
      if (prev) onNavigate(prev.chapter, prev.paragraph)
      return null
    })
  }, [])

  return useMemo(
    () => ({ savedPosition, savePosition, clearPosition, navigateBack }),
    [savedPosition, savePosition, clearPosition, navigateBack],
  )
}

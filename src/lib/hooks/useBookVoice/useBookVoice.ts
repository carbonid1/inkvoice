'use client'

import { useVoiceStore } from '@/store/useVoiceStore'
import { useCallback, useMemo } from 'react'

export const useBookVoice = (bookId: string) => {
  const globalVoice = useVoiceStore(s => s.voice)
  const bookVoice = useVoiceStore(s => s.bookVoices[bookId])
  const setBookVoice = useVoiceStore(s => s.setBookVoice)
  const clearBookVoice = useVoiceStore(s => s.clearBookVoice)

  const effectiveVoice = bookVoice ?? globalVoice
  const isOverridden = bookVoice !== undefined

  const setVoice = useCallback(
    (voice: string) => setBookVoice(bookId, voice),
    [bookId, setBookVoice],
  )

  const clearVoice = useCallback(() => clearBookVoice(bookId), [bookId, clearBookVoice])

  return useMemo(
    () => ({ effectiveVoice, globalVoice, isOverridden, setVoice, clearVoice }),
    [effectiveVoice, globalVoice, isOverridden, setVoice, clearVoice],
  )
}

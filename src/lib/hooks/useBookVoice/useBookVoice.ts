'use client'

import { useCallback, useMemo } from 'react'
import { getVoiceFallback } from '@/lib/services/voice/helpers/getVoiceFallback/getVoiceFallback'
import { useVoiceStore } from '@/store/useVoiceStore'

export const useBookVoice = (bookId: string, availableVoiceNames?: string[]) => {
  const globalVoice = useVoiceStore(s => s.voice)
  const bookVoice = useVoiceStore(s => s.bookVoices[bookId])
  const setBookVoice = useVoiceStore(s => s.setBookVoice)
  const clearBookVoice = useVoiceStore(s => s.clearBookVoice)

  const rawEffective = bookVoice ?? globalVoice
  const isOverridden = bookVoice !== undefined

  const effectiveVoice = useMemo(
    () => getVoiceFallback(rawEffective, availableVoiceNames ?? []),
    [rawEffective, availableVoiceNames],
  )

  const isStale = useMemo(() => {
    if (!availableVoiceNames || availableVoiceNames.length === 0) return false
    return rawEffective !== effectiveVoice
  }, [rawEffective, availableVoiceNames, effectiveVoice])

  const setVoice = useCallback(
    (voice: string) => setBookVoice(bookId, voice),
    [bookId, setBookVoice],
  )

  const clearVoice = useCallback(() => clearBookVoice(bookId), [bookId, clearBookVoice])

  return useMemo(
    () => ({ effectiveVoice, globalVoice, isOverridden, isStale, setVoice, clearVoice }),
    [effectiveVoice, globalVoice, isOverridden, isStale, setVoice, clearVoice],
  )
}

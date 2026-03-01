'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PlayingState } from './useVoicePreview.types'

export type { PlayingState }

export const useVoicePreview = () => {
  const [playing, setPlaying] = useState<PlayingState>(null)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playingRef = useRef<PlayingState>(null)
  const blobUrlRef = useRef<string | null>(null)

  // Keep ref in sync with state for stable callback reads
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.pause()
      audioRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  useEffect(() => cleanup, [cleanup])

  const play = useCallback(
    async (voiceName: string, type: 'source' | 'sample') => {
      setError(null)

      // Toggle off if same voice+type is already playing
      if (playingRef.current?.name === voiceName && playingRef.current?.type === type) {
        cleanup()
        setPlaying(null)
        return
      }

      // Stop any current playback
      cleanup()

      try {
        const response = await fetch(`/api/voices/${voiceName}/${type}?v=3`)
        if (!response.ok) {
          setError(`No ${type} available for "${voiceName}"`)
          setPlaying(null)
          return
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        const audio = new Audio(url)
        audioRef.current = audio
        setPlaying({ name: voiceName, type })

        audio.onended = () => {
          setPlaying(null)
          URL.revokeObjectURL(url)
          blobUrlRef.current = null
        }

        audio.onerror = () => {
          setError(`Failed to play ${type} for "${voiceName}"`)
          setPlaying(null)
          URL.revokeObjectURL(url)
          blobUrlRef.current = null
        }

        await audio.play()
      } catch {
        setError(`Failed to load ${type} for "${voiceName}"`)
        setPlaying(null)
      }
    },
    [cleanup],
  )

  return useMemo(() => ({ playing, error, play }), [playing, error, play])
}

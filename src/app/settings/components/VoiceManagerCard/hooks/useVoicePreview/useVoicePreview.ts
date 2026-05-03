'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AudioType, PlayingState } from './useVoicePreview.types'

export type { AudioType, PlayingState }

export const useVoicePreview = () => {
  const [playing, setPlaying] = useState<PlayingState>(null)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playingRef = useRef<PlayingState>(null)
  const blobCacheRef = useRef<Map<string, string>>(new Map())

  // Ref mirror keeps `play` stable — reading state directly would force a new callback each render
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    stopPlayback()
    setPlaying(null)
  }, [stopPlayback])

  const cleanup = useCallback(() => {
    stopPlayback()
    for (const url of blobCacheRef.current.values()) {
      URL.revokeObjectURL(url)
    }
    blobCacheRef.current.clear()
  }, [stopPlayback])

  useEffect(() => cleanup, [cleanup])

  const play = useCallback(
    async (voiceName: string, type: AudioType) => {
      setError(null)

      if (playingRef.current?.name === voiceName && playingRef.current?.type === type) {
        stopPlayback()
        setPlaying(null)
        return
      }

      // Stop playback but keep cached blob URLs for replay
      stopPlayback()

      const cacheKey = `${voiceName}:${type}`

      try {
        let url = blobCacheRef.current.get(cacheKey)

        if (!url) {
          // Bump ?v= when samples are regenerated — API returns immutable cache headers
          const response = await fetch(`/api/voices/${voiceName}/${type}?v=4`)

          if (!response.ok) {
            setError(`No ${type} available for "${voiceName}"`)
            setPlaying(null)
            return
          }

          const blob = await response.blob()

          url = URL.createObjectURL(blob)
          blobCacheRef.current.set(cacheKey, url)
        }

        const audio = new Audio(url)

        audioRef.current = audio
        setPlaying({ name: voiceName, type })

        audio.onended = () => {
          setPlaying(null)
        }

        audio.onerror = () => {
          setError(`Failed to play ${type} for "${voiceName}"`)
          setPlaying(null)
        }

        await audio.play()
      } catch {
        setError(`Failed to load ${type} for "${voiceName}"`)
        setPlaying(null)
      }
    },
    [stopPlayback],
  )

  return useMemo(() => ({ playing, error, play, stop }), [playing, error, play, stop])
}

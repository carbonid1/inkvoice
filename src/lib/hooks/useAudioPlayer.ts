'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

interface AudioPlayerState {
  isPlaying: boolean
  isLoading: boolean
  error: string | null
}

interface UseAudioPlayerOptions {
  onEnded?: () => void
  onError?: (error: string) => void
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const { onEnded, onError } = options
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    error: null,
  })

  // Track user intent to allow pausing while loading
  const wantToPlayRef = useRef(true)

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()

      audioRef.current.onended = () => {
        onEnded?.()
      }

      audioRef.current.onerror = () => {
        const error = 'Audio playback error'
        setState((s) => ({ ...s, error, isPlaying: false }))
        onError?.(error)
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [onEnded, onError])

  const play = useCallback(async (audioUrl: string) => {
    if (!audioRef.current) return

    wantToPlayRef.current = true
    setState((s) => ({ ...s, isLoading: true, error: null }))

    try {
      audioRef.current.pause()
      audioRef.current.src = audioUrl
      await audioRef.current.play()
      setState((s) => ({ ...s, isPlaying: true, isLoading: false }))
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to play audio'
      setState((s) => ({ ...s, error, isPlaying: false, isLoading: false }))
    }
  }, [])

  const pause = useCallback(() => {
    wantToPlayRef.current = false
    audioRef.current?.pause()
    setState((s) => ({ ...s, isPlaying: false }))
  }, [])

  const setPlaying = useCallback((playing: boolean) => {
    if (playing) {
      wantToPlayRef.current = true
    } else {
      wantToPlayRef.current = false
      audioRef.current?.pause()
    }
    setState((s) => ({ ...s, isPlaying: playing }))
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setState((s) => ({ ...s, isLoading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error }))
  }, [])

  const shouldPlay = useCallback(() => wantToPlayRef.current, [])

  return {
    ...state,
    play,
    pause,
    setPlaying,
    setLoading,
    setError,
    shouldPlay,
  }
}

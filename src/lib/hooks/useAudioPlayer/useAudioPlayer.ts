'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface AudioPlayerState {
  isPlaying: boolean
  isLoading: boolean
  error: string | null
}

interface UseAudioPlayerOptions {
  onEnded?: () => void
  onError?: (error: string) => void
}

export const useAudioPlayer = (options: UseAudioPlayerOptions = {}) => {
  const { onEnded, onError } = options
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const onEndedRef = useRef(onEnded)
  const onErrorRef = useRef(onError)
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    error: null,
  })

  // Keep callback refs in sync (avoids stale closures)
  useEffect(() => {
    onEndedRef.current = onEnded
    onErrorRef.current = onError
  })

  // Track user intent to allow pausing while loading
  const wantToPlayRef = useRef(true)

  // Initialize audio element once
  useEffect(() => {
    audioRef.current = new Audio()

    audioRef.current.onended = () => {
      onEndedRef.current?.()
    }

    audioRef.current.onerror = () => {
      const msg = 'Audio playback error'
      setState(s => (s.error === msg && !s.isPlaying ? s : { ...s, error: msg, isPlaying: false }))
      onErrorRef.current?.(msg)
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const play = useCallback(async (audioUrl: string) => {
    if (!audioRef.current) return

    wantToPlayRef.current = true
    setState(s => (s.isLoading && !s.error ? s : { ...s, isLoading: true, error: null }))

    try {
      audioRef.current.pause()
      audioRef.current.src = audioUrl
      await audioRef.current.play()
      setState(s => (s.isPlaying && !s.isLoading ? s : { ...s, isPlaying: true, isLoading: false }))
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to play audio'
      setState(s => ({ ...s, error, isPlaying: false, isLoading: false }))
    }
  }, [])

  const resume = useCallback(async () => {
    if (!audioRef.current) return

    wantToPlayRef.current = true

    try {
      await audioRef.current.play()
      setState(s => (s.isPlaying ? s : { ...s, isPlaying: true, error: null }))
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to resume audio'
      setState(s => ({ ...s, error, isPlaying: false }))
    }
  }, [])

  const pause = useCallback(() => {
    wantToPlayRef.current = false
    audioRef.current?.pause()
    setState(s => (s.isPlaying ? { ...s, isPlaying: false } : s))
  }, [])

  const setPlaying = useCallback((playing: boolean) => {
    if (playing) {
      wantToPlayRef.current = true
    } else {
      wantToPlayRef.current = false
      audioRef.current?.pause()
    }
    setState(s => (s.isPlaying === playing ? s : { ...s, isPlaying: playing }))
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setState(s => (s.isLoading === isLoading ? s : { ...s, isLoading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(s => (s.error === error ? s : { ...s, error }))
  }, [])

  const shouldPlay = useCallback(() => wantToPlayRef.current, [])

  return useMemo(
    () => ({
      ...state,
      play,
      resume,
      pause,
      setPlaying,
      setLoading,
      setError,
      shouldPlay,
    }),
    [state, play, resume, pause, setPlaying, setLoading, setError, shouldPlay],
  )
}

'use client'

import { useTheme } from 'next-themes'
import { useCallback, useSyncExternalStore } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'

const THEME_CYCLE = ['system', 'light', 'dark'] as const

const THEME_LABELS: Record<string, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export const ThemeCycler = () => {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  const cycleTheme = useCallback(() => {
    if (!mounted) return
    const current = theme ?? 'system'
    const currentIndex = THEME_CYCLE.indexOf(current as (typeof THEME_CYCLE)[number])
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length
    const next = THEME_CYCLE[nextIndex] ?? 'system'
    setTheme(next)
    toast(`Theme: ${THEME_LABELS[next]}`, { duration: 2000 })
  }, [theme, setTheme, mounted])

  useHotkeys('shift+t', cycleTheme, { preventDefault: true })

  return null
}

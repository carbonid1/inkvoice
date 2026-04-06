'use client'

import { Select } from '@/components/Select/Select'
import type { SelectOption, SelectOptionState } from '@/components/Select/Select.types'
import { Kbd } from '@/components/ui/Kbd/Kbd'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

type ThemeOption = SelectOption & { icon: typeof Sun }

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

const renderThemeOption = (option: SelectOption, state: SelectOptionState) => {
  const Icon = (option as ThemeOption).icon
  return (
    <span className="flex items-center gap-2">
      <Icon className="size-4" />
      <span className={state.selected ? 'font-medium' : ''}>{option.label}</span>
    </span>
  )
}

export const AppearanceCard = () => {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  return (
    <section className="border-border bg-background rounded-lg border p-6 shadow-xs">
      <h2 className="mb-4 text-lg font-semibold">Appearance</h2>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          Theme
          <Kbd keys={['shift', 'T']} size="sm" />
        </span>
        {mounted ? (
          <Select
            value={theme ?? 'system'}
            onChange={setTheme}
            options={THEME_OPTIONS}
            renderOption={renderThemeOption}
            className="bg-muted rounded-sm px-3 py-1.5 text-sm"
            aria-label="Theme"
          />
        ) : (
          <div className="bg-muted flex items-center justify-between gap-2 rounded-sm px-3 py-1.5 text-sm">
            <span className="bg-muted-foreground/20 h-4 w-12 rounded-sm" />
            <span className="size-4 shrink-0" />
          </div>
        )}
      </div>
    </section>
  )
}

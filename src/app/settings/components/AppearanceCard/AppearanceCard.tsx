'use client'

import { Select } from '@/components/Select/Select'
import type { SelectOption, SelectOptionState } from '@/components/Select/Select.types'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

type ThemeOption = SelectOption & { icon: typeof Sun }

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const renderThemeOption = (option: SelectOption, state: SelectOptionState) => {
  const Icon = (option as ThemeOption).icon
  return (
    <span className="flex items-center gap-2">
      <Icon className="w-4 h-4" />
      <span className={state.selected ? 'font-medium' : ''}>{option.label}</span>
    </span>
  )
}

export const AppearanceCard = () => {
  const { theme, setTheme } = useTheme()

  return (
    <section className="bg-background rounded-lg p-6 shadow-sm border border-border">
      <h2 className="text-lg font-semibold mb-4">Appearance</h2>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Theme</span>
        <Select
          value={theme ?? 'system'}
          onChange={setTheme}
          options={THEME_OPTIONS}
          renderOption={renderThemeOption}
          className="text-sm bg-muted rounded px-3 py-1.5"
          aria-label="Theme"
        />
      </div>
    </section>
  )
}

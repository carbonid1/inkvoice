'use client'

import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useEffect, useMemo, useRef, useState } from 'react'

type ExtraOption = { value: string; label: string }

type VoiceSelectProps = {
  voices: VoiceEntry[]
  value: string
  onChange: (name: string) => void
  placeholder?: string
  id?: string
  className?: string
  extraOptions?: ExtraOption[]
  'aria-label'?: string
}

type SelectableItem =
  | { kind: 'extra'; value: string; label: string }
  | { kind: 'voice'; voice: VoiceEntry }

export const VoiceSelect = ({
  voices,
  value,
  onChange,
  placeholder,
  id,
  className,
  extraOptions,
  'aria-label': ariaLabel,
}: VoiceSelectProps) => {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedExtra = extraOptions?.find(o => o.value === value)
  const selectedVoice = voices.find(v => v.name === value)
  const displayText = selectedExtra?.label ?? selectedVoice?.displayName ?? placeholder ?? value

  const appVoices = useMemo(() => voices.filter(v => v.type === 'app'), [voices])
  const customVoices = useMemo(() => voices.filter(v => v.type === 'custom'), [voices])

  // Flat list of all selectable items for keyboard navigation
  const items: SelectableItem[] = useMemo(
    () => [
      ...(extraOptions ?? []).map(o => ({
        kind: 'extra' as const,
        value: o.value,
        label: o.label,
      })),
      ...appVoices.map(v => ({ kind: 'voice' as const, voice: v })),
      ...customVoices.map(v => ({ kind: 'voice' as const, voice: v })),
    ],
    [extraOptions, appVoices, customVoices],
  )

  const getItemValue = (item: SelectableItem): string =>
    item.kind === 'extra' ? item.value : item.voice.name

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectItem = (itemValue: string) => {
    onChange(itemValue)
    setOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setHighlightedIndex(-1)
      return
    }

    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
        setHighlightedIndex(0)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const highlighted = items[highlightedIndex]
      if (highlighted) {
        selectItem(getItemValue(highlighted))
      }
    }
  }

  const itemClassName = (index: number, itemValue: string) => {
    const base = 'px-3 py-2 cursor-pointer'
    const highlight =
      index === highlightedIndex
        ? 'bg-blue-50 dark:bg-blue-900/20'
        : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
    const selected = itemValue === value ? 'font-medium' : ''
    return `${base} ${highlight} ${selected}`
  }

  // Track which items belong to which group for rendering group headers
  const appStartIndex = (extraOptions ?? []).length
  const customStartIndex = appStartIndex + appVoices.length

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        id={id}
        className={className}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setOpen(prev => !prev)}
      >
        {displayText}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {items.map((item, index) => {
            const itemValue = getItemValue(item)
            const showAppHeader = index === appStartIndex && appVoices.length > 0
            const showCustomHeader = index === customStartIndex && customVoices.length > 0

            return (
              <li key={itemValue} role="presentation">
                {showAppHeader && (
                  <div className="text-xs font-medium text-gray-500 uppercase px-3 pt-2 pb-1">
                    App Voices
                  </div>
                )}
                {showCustomHeader && (
                  <div className="text-xs font-medium text-gray-500 uppercase px-3 pt-2 pb-1">
                    Custom Voices
                  </div>
                )}
                <div
                  role="option"
                  aria-selected={value === itemValue}
                  className={itemClassName(index, itemValue)}
                  onClick={() => selectItem(itemValue)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {item.kind === 'extra' ? (
                    <span>{item.label}</span>
                  ) : (
                    <>
                      <span>{item.voice.displayName}</span>
                      {item.voice.tags.length > 0 && (
                        <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {item.voice.tags.join(', ')}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

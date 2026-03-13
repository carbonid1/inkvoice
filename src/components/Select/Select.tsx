'use client'

import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SelectOption, SelectProps } from './Select.types'

export const Select = ({
  value,
  onChange,
  options,
  groups,
  placeholder,
  id,
  className,
  menuClassName,
  renderOption,
  onOpenChange,
  'aria-label': ariaLabel,
}: SelectProps) => {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const changeOpen = useCallback(
    (next: boolean) => {
      setOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange],
  )

  // Build flat items list with group metadata
  const { items, groupStartIndices } = useMemo(() => {
    const flat: SelectOption[] = [...(options ?? [])]
    const starts: { index: number; label: string }[] = []

    for (const group of groups ?? []) {
      starts.push({ index: flat.length, label: group.label })
      flat.push(...group.options)
    }

    return { items: flat, groupStartIndices: starts }
  }, [options, groups])

  const selectedOption = items.find(o => o.value === value)
  const displayText = selectedOption?.label ?? placeholder ?? value

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        changeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [changeOpen])

  const selectItem = (itemValue: string) => {
    onChange(itemValue)
    changeOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      changeOpen(false)
      setHighlightedIndex(-1)
      return
    }

    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        changeOpen(true)
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
        selectItem(highlighted.value)
      }
    }
  }

  const itemClassName = (index: number, itemValue: string) => {
    const base = 'px-3 py-2.5 cursor-pointer'
    const highlight =
      index === highlightedIndex
        ? 'bg-blue-50 dark:bg-blue-900/20'
        : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
    const selected = itemValue === value ? 'font-medium' : ''
    return `${base} ${highlight} ${selected}`
  }

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        id={id}
        className={`flex items-center justify-between gap-2 ${className ?? ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => changeOpen(!open)}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute z-50 mt-1 min-w-full w-max bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto ${menuClassName ?? ''}`}
        >
          {items.map((item, index) => {
            const groupHeader = groupStartIndices.find(g => g.index === index)

            return (
              <li key={item.value} role="presentation">
                {groupHeader && (
                  <div className="text-xs font-medium text-muted-foreground uppercase px-3 pt-2 pb-1">
                    {groupHeader.label}
                  </div>
                )}
                <div
                  role="option"
                  aria-selected={value === item.value}
                  className={itemClassName(index, item.value)}
                  onClick={() => selectItem(item.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {renderOption
                    ? renderOption(item, {
                        highlighted: index === highlightedIndex,
                        selected: value === item.value,
                      })
                    : item.label}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

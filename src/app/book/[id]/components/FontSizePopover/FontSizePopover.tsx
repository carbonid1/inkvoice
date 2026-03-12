'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import { useDisplayStore } from '@/store/useDisplayStore'
import { ALargeSmall } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { FONT_SIZE_OPTIONS } from './FontSizePopover.consts'

export const FontSizePopover = () => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fontSize = useDisplayStore(s => s.fontSize)
  const setFontSize = useDisplayStore(s => s.setFontSize)

  const toggle = useCallback(() => setOpen(prev => !prev), [])

  useHotkeys('f', toggle)

  // Close on click outside
  useEffect(() => {
    if (!open) return

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <Tooltip label="Font Size" shortcut="F" position="bottom" disabled={open}>
        <button
          onClick={toggle}
          className="inline-flex items-center bg-muted rounded px-2 py-1.5 hover:bg-accent transition-colors"
          aria-label="Font Size"
        >
          <ALargeSmall className="w-4 h-4" />
        </button>
      </Tooltip>

      {open && (
        <div className="absolute z-50 mt-1 right-0 bg-background border border-border rounded-lg shadow-lg p-1 flex gap-1">
          {FONT_SIZE_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setFontSize(option.value)}
              aria-pressed={fontSize === option.value}
              className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                fontSize === option.value
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { type ReactElement, cloneElement, useCallback, useEffect, useRef, useState } from 'react'

type TooltipProps = {
  label: string
  shortcut?: string
  position?: 'top' | 'bottom'
  maxWidth?: number
  children: ReactElement
}

const SHOW_DELAY = 200

export const Tooltip = ({
  label,
  shortcut,
  position = 'top',
  maxWidth,
  children,
}: TooltipProps) => {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), SHOW_DELAY)
  }, [])

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setVisible(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const positionClasses = position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {cloneElement(children, {
        'aria-label': children.props['aria-label'] ?? label,
      })}
      {visible && (
        <div
          role="tooltip"
          style={maxWidth ? { maxWidth } : undefined}
          className={`absolute left-1/2 -translate-x-1/2 z-50 ${maxWidth ? 'whitespace-normal' : 'whitespace-nowrap'}
            pointer-events-none bg-gray-900 dark:bg-gray-100
            text-white dark:text-gray-900 text-xs rounded-lg shadow-lg
            px-2.5 py-1.5 flex items-center gap-1.5 ${positionClasses}`}
        >
          {label}
          {shortcut && (
            <kbd className="bg-gray-700 dark:bg-gray-300 rounded px-1 py-0.5 font-mono text-[10px] leading-none">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  )
}

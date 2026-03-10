'use client'

import { type ReactElement, cloneElement, useCallback, useEffect, useRef, useState } from 'react'

type TooltipProps = {
  label: string
  shortcut?: string
  position?: 'top' | 'bottom'
  delay?: number
  maxWidth?: number
  disabled?: boolean
  className?: string
  children: ReactElement
}

const DEFAULT_DELAY = 200

export const Tooltip = ({
  label,
  shortcut,
  position = 'top',
  delay = DEFAULT_DELAY,
  maxWidth,
  disabled,
  className,
  children,
}: TooltipProps) => {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const show = useCallback(() => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => setVisible(true), delay)
  }, [disabled, delay])

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setVisible(false)
  }, [])

  useEffect(() => {
    if (disabled && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [disabled])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    let lastCheck = 0
    const handlePointerMove = (e: PointerEvent) => {
      if (e.timeStamp - lastCheck < 100) return
      lastCheck = e.timeStamp
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (!rect) return
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      if (!inside) hide()
    }
    document.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => document.removeEventListener('pointermove', handlePointerMove)
  }, [visible, hide])

  const positionClasses = position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'

  return (
    <div
      ref={wrapperRef}
      className={`relative inline-flex${className ? ` ${className}` : ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onPointerDown={hide}
      onFocus={show}
      onBlur={hide}
    >
      {cloneElement(children, {
        'aria-label': children.props['aria-label'] ?? label,
      })}
      {visible && !disabled && (
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

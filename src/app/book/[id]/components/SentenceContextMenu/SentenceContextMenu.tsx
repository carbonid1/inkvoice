'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type ContextMenuTarget = {
  x: number
  y: number
  chapter: number
  sentence: number
}

type SentenceContextMenuProps = {
  target: ContextMenuTarget | null
  onRegenerate: (chapter: number, sentence: number) => Promise<void>
  onClose: () => void
}

export const SentenceContextMenu = ({
  target,
  onRegenerate,
  onClose,
}: SentenceContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 })

  useLayoutEffect(() => {
    if (!target || !menuRef.current) return
    const menu = menuRef.current
    const left = Math.min(target.x, window.innerWidth - menu.offsetWidth - 8)
    const top = Math.min(target.y, window.innerHeight - menu.offsetHeight - 8)
    setPosition({ left: Math.max(8, left), top: Math.max(8, top) })
  }, [target])

  useEffect(() => {
    if (!target) return
    setLoading(false)
  }, [target])

  useEffect(() => {
    if (!target) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [target, onClose])

  if (!target) return null

  const handleClick = async () => {
    setLoading(true)
    try {
      await onRegenerate(target.chapter, target.sentence)
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <div
      ref={menuRef}
      style={{ left: position.left, top: position.top }}
      className="fixed z-50 min-w-[180px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
      role="menu"
    >
      <button
        role="menuitem"
        onClick={handleClick}
        disabled={loading}
        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Regenerating...' : 'Regenerate Audio'}
      </button>
    </div>
  )
}

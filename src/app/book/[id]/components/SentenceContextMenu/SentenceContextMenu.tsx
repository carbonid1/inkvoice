'use client'

import { Copy, RefreshCw } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type ContextMenuTarget = {
  x: number
  y: number
  chapter: number
  sentence: number
}

type SentenceContextMenuProps = {
  target: ContextMenuTarget | null
  onRegenerate: (chapter: number, sentence: number) => void | Promise<void>
  onCopyText: (chapter: number, sentence: number) => void
  onClose: () => void
}

export const SentenceContextMenu = ({
  target,
  onRegenerate,
  onCopyText,
  onClose,
}: SentenceContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
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

  const handleCopy = () => {
    onCopyText(target.chapter, target.sentence)
    onClose()
  }

  const handleRegenerate = () => {
    onRegenerate(target.chapter, target.sentence)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      style={{ left: position.left, top: position.top }}
      className="fixed z-50 min-w-[180px] bg-background rounded-lg shadow-lg border border-border py-1"
      role="menu"
    >
      <button
        role="menuitem"
        onClick={handleCopy}
        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent transition-colors"
      >
        <Copy className="w-4 h-4" />
        Copy Text
      </button>
      <div className="border-t border-border" />
      <button
        role="menuitem"
        onClick={handleRegenerate}
        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Regenerate Audio
      </button>
    </div>
  )
}

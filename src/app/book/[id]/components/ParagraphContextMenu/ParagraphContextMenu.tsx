'use client'

import { Button } from '@/components/ui/Button/Button'
import { Copy, RefreshCw } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type ContextMenuTarget = {
  x: number
  y: number
  chapter: number
  paragraph: number
}

type ParagraphContextMenuProps = {
  target: ContextMenuTarget | null
  onRegenerate: (chapter: number, paragraph: number) => void | Promise<void>
  onCopyText: (chapter: number, paragraph: number) => void
  onClose: () => void
}

export const ParagraphContextMenu = ({
  target,
  onRegenerate,
  onCopyText,
  onClose,
}: ParagraphContextMenuProps) => {
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
    onCopyText(target.chapter, target.paragraph)
    onClose()
  }

  const handleRegenerate = () => {
    onRegenerate(target.chapter, target.paragraph)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      style={{ left: position.left, top: position.top }}
      className="fixed z-50 min-w-[180px] bg-background rounded-lg shadow-lg border border-border py-1"
      role="menu"
    >
      <Button role="menuitem" size="small" fullWidth onClick={handleCopy}>
        <Copy className="w-4 h-4" />
        Copy Text
      </Button>
      <div className="border-t border-border" />
      <Button role="menuitem" size="small" fullWidth onClick={handleRegenerate}>
        <RefreshCw className="w-4 h-4" />
        Regenerate Audio
      </Button>
    </div>
  )
}

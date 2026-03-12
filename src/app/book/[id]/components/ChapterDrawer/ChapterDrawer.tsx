'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import type { TocNode } from '@/lib/types/book'
import { ChevronDown, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { computeStartPages } from '../../helpers/computeStartPages/computeStartPages'
import type { ChapterDrawerProps } from './ChapterDrawer.types'

export const ChapterDrawer = ({
  isOpen,
  onClose,
  onNavigate,
  chapters,
  tocTree,
  currentChapter,
}: ChapterDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null)

  const startPages = useMemo(() => computeStartPages(chapters.map(c => c.wordCount)), [chapters])

  useHotkeys('t', onClose, { enabled: isOpen })
  useHotkeys('escape', onClose, { enabled: isOpen })

  useEffect(() => {
    if (isOpen) {
      drawerRef.current?.focus()
      requestAnimationFrame(() => {
        drawerRef.current?.querySelector('[data-active]')?.scrollIntoView({ block: 'center' })
      })
    }
  }, [isOpen])

  const handleNavigate = (chapterIndex: number) => {
    onNavigate(chapterIndex)
    onClose()
  }

  const renderChapterRow = (chapterIndex: number, title: string, indent: number = 0) => {
    const chapter = chapters[chapterIndex]
    if (!chapter) return null

    const startPage = startPages[chapterIndex]
    const isCurrent = chapterIndex === currentChapter

    return (
      <button
        key={chapterIndex}
        data-active={isCurrent || undefined}
        data-chapter-index={chapterIndex}
        title={title}
        onClick={() => handleNavigate(chapterIndex)}
        className={`w-full text-left px-4 py-2.5 transition-colors flex items-center gap-2 min-w-0 ${
          isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-accent'
        }`}
        style={indent > 0 ? { paddingLeft: `${16 + indent * 20}px` } : undefined}
      >
        <span
          className={`text-sm truncate flex-1 ${
            isCurrent ? 'font-medium text-blue-700 dark:text-blue-300' : ''
          }`}
        >
          {title}
        </span>
        {startPage !== undefined && (
          <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
            {startPage}
          </span>
        )}
      </button>
    )
  }

  const renderTocGroup = (node: TocNode, indent: number = 0) => {
    if (node.children.length === 0) {
      return renderChapterRow(node.chapterIndex, node.title, indent)
    }

    return (
      <TocGroupCollapsible
        key={`group-${node.chapterIndex}`}
        node={node}
        indent={indent}
        currentChapter={currentChapter}
        startPage={startPages[node.chapterIndex]}
        onNavigate={handleNavigate}
        renderTocGroup={renderTocGroup}
      />
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label="Table of Contents"
        tabIndex={-1}
        className={`fixed inset-y-0 left-0 w-96 max-w-[85vw] z-40 bg-background border-r border-border shadow-xl transition-transform duration-200 ease-out outline-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Table of Contents</h2>
          <Tooltip label="Close" shortcut="Esc" position="bottom">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        {/* Chapter list — only rendered when open to avoid re-rendering on every sentence advance */}
        <div className="overflow-y-auto h-[calc(100%-57px)]">
          {isOpen &&
            (tocTree ? (
              <div className="pt-1 pb-8">{tocTree.map(node => renderTocGroup(node))}</div>
            ) : (
              <div className="pt-1 pb-8">
                {chapters.map((chapter, idx) => renderChapterRow(idx, chapter.title))}
              </div>
            ))}
        </div>
      </div>
    </>
  )
}

type TocGroupCollapsibleProps = {
  node: TocNode
  indent: number
  currentChapter: number
  startPage: number | undefined
  onNavigate: (chapter: number) => void
  renderTocGroup: (node: TocNode, indent: number) => React.ReactNode
}

const TocGroupCollapsible = ({
  node,
  indent,
  currentChapter,
  startPage,
  onNavigate,
  renderTocGroup,
}: TocGroupCollapsibleProps) => {
  const containsCurrent = nodeContainsChapter(node, currentChapter)
  const isCurrent = node.chapterIndex === currentChapter
  const [isExpanded, setIsExpanded] = useState(containsCurrent)

  return (
    <div>
      <div
        data-active={isCurrent || undefined}
        className={`flex items-center gap-1 ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      >
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="p-2.5 hover:bg-accent rounded transition-colors"
          style={indent > 0 ? { marginLeft: `${indent * 20}px` } : undefined}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isExpanded ? '' : '-rotate-90'
            }`}
          />
        </button>
        <button
          onClick={() => onNavigate(node.chapterIndex)}
          className={`flex-1 text-left text-sm py-2.5 pr-4 transition-colors ${
            isCurrent
              ? 'font-medium text-blue-700 dark:text-blue-300'
              : 'hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          {node.title}
        </button>
        {startPage !== undefined && (
          <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums pr-4">
            {startPage}
          </span>
        )}
      </div>

      {isExpanded && <div>{node.children.map(child => renderTocGroup(child, indent + 1))}</div>}
    </div>
  )
}

const nodeContainsChapter = (node: TocNode, chapter: number): boolean => {
  if (node.chapterIndex === chapter) return true
  return node.children.some(child => nodeContainsChapter(child, chapter))
}

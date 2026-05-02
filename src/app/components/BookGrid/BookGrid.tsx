'use client'

import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { Fragment, type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Book } from '@/lib/types/book'
import { BookCard } from '../BookCard/BookCard'

interface BookGridProps {
  books: Book[]
  onRemove: (bookId: string) => void
  // Optional cell rendered as the first item (used for the "Add book" tile).
  // Hidden when a search query is active so it doesn't compete with results.
  firstCell?: ReactNode
}

// Same breakpoints as the original CSS grid (`grid-cols-2 sm:3 md:4 lg:5`),
// resolved manually because the row virtualizer needs the column count.
const BREAKPOINTS: Array<[number, number]> = [
  [1024, 5],
  [768, 4],
  [640, 3],
  [0, 2],
]

const ROW_GAP_PX = 16
// Empirical from a 5-col layout (~430px observed). measureElement corrects per
// row after first render; this estimate just keeps the initial scrollbar honest.
const ROW_HEIGHT_ESTIMATE_PX = 430

const colsForWidth = (width: number): number => {
  for (const [min, cols] of BREAKPOINTS) {
    if (width >= min) return cols
  }
  return 2
}

type GridItem = { kind: 'first-cell' } | { kind: 'book'; book: Book }

export const BookGrid = ({ books, onRemove, firstCell }: BookGridProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [cols, setCols] = useState(5)
  const [scrollMargin, setScrollMargin] = useState(0)

  // One observer drives both: column count derives from container width, and
  // scrollMargin pins the virtualizer's origin to the grid container's top so
  // the first row renders below the page header rather than under it.
  useLayoutEffect(() => {
    const node = containerRef.current

    if (!node) return

    const update = (): void => {
      const nextCols = colsForWidth(node.clientWidth)

      setCols(prev => (prev === nextCols ? prev : nextCols))

      const top = node.getBoundingClientRect().top + window.scrollY

      setScrollMargin(prev => (prev === top ? prev : top))
    }

    update()

    const observer = new ResizeObserver(update)

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const items = useMemo<GridItem[]>(
    () =>
      firstCell
        ? [{ kind: 'first-cell' }, ...books.map(book => ({ kind: 'book' as const, book }))]
        : books.map(book => ({ kind: 'book' as const, book })),
    [books, firstCell],
  )

  const rowCount = Math.ceil(items.length / cols)

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => ROW_HEIGHT_ESTIMATE_PX,
    overscan: 3,
    scrollMargin,
  })

  return (
    <div
      ref={containerRef}
      style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}
    >
      {rowVirtualizer.getVirtualItems().map(virtualRow => {
        const start = virtualRow.index * cols
        const rowItems = items.slice(start, start + cols)

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
              paddingBottom: ROW_GAP_PX,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: ROW_GAP_PX,
              }}
            >
              {rowItems.map(item =>
                item.kind === 'first-cell' ? (
                  <Fragment key="first-cell">{firstCell}</Fragment>
                ) : (
                  <BookCard key={item.book.id} book={item.book} onRemove={onRemove} />
                ),
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

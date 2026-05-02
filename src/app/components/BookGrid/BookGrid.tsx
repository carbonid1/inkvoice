'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Fragment,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Book } from '@/lib/types/book'
import { BookCard } from '../BookCard/BookCard'

interface BookGridProps {
  books: Book[]
  onRemove: (bookId: string) => void
  scrollElementRef: RefObject<HTMLElement | null>
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

export const BookGrid = ({ books, onRemove, scrollElementRef, firstCell }: BookGridProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [cols, setCols] = useState(5)
  const [scrollMargin, setScrollMargin] = useState(0)

  // One observer drives both: column count derives from container width, and
  // scrollMargin offsets the virtualizer's origin so rows align with the grid
  // container's actual position inside the scroll element (e.g. accounts for
  // sibling content above the grid). The math stays stable across scroll
  // because (container.top - scrollEl.top) shrinks by exactly scrollEl.scrollTop.
  useLayoutEffect(() => {
    const node = containerRef.current
    const scrollEl = scrollElementRef.current

    if (!node || !scrollEl) return

    const update = (): void => {
      const nextCols = colsForWidth(node.clientWidth)

      setCols(prev => (prev === nextCols ? prev : nextCols))

      const top =
        node.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop

      setScrollMargin(prev => (prev === top ? prev : top))
    }

    update()

    const observer = new ResizeObserver(update)

    observer.observe(node)
    observer.observe(scrollEl)
    return () => observer.disconnect()
  }, [scrollElementRef])

  const items = useMemo<GridItem[]>(
    () =>
      firstCell
        ? [{ kind: 'first-cell' }, ...books.map(book => ({ kind: 'book' as const, book }))]
        : books.map(book => ({ kind: 'book' as const, book })),
    [books, firstCell],
  )

  const rowCount = Math.ceil(items.length / cols)

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual returns unstable functions; nothing actionable
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElementRef.current,
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

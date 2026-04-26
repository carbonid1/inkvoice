import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Bookmark } from '@/lib/services/bookmark/bookmark.types'
import { useRecoveryBanner } from './useRecoveryBanner'

const bookmark = (overrides: Partial<Bookmark> = {}): Bookmark => ({
  id: 'bm-1',
  chapter: 5,
  paragraph: 10,
  createdAt: Date.now(),
  ...overrides,
})

describe('useRecoveryBanner', () => {
  it('shows banner when bookmark exists at different position', () => {
    const { result } = renderHook(() =>
      useRecoveryBanner({
        bookmarks: [bookmark()],
        currentChapter: 0,
        currentParagraph: 0,
      }),
    )

    expect(result.current.showBanner).toBe(true)
    expect(result.current.recoveryBookmark).toEqual(expect.objectContaining({ id: 'bm-1' }))
  })

  it('hides banner when no bookmarks', () => {
    const { result } = renderHook(() =>
      useRecoveryBanner({
        bookmarks: [],
        currentChapter: 0,
        currentParagraph: 0,
      }),
    )

    expect(result.current.showBanner).toBe(false)
    expect(result.current.recoveryBookmark).toBeUndefined()
  })

  it('hides banner when at bookmark position', () => {
    const { result } = renderHook(() =>
      useRecoveryBanner({
        bookmarks: [bookmark({ chapter: 3, paragraph: 7 })],
        currentChapter: 3,
        currentParagraph: 7,
      }),
    )

    expect(result.current.showBanner).toBe(false)
  })

  it('hides banner after dismiss', () => {
    const { result } = renderHook(() =>
      useRecoveryBanner({
        bookmarks: [bookmark()],
        currentChapter: 0,
        currentParagraph: 0,
      }),
    )

    expect(result.current.showBanner).toBe(true)
    act(() => result.current.dismissBanner())
    expect(result.current.showBanner).toBe(false)
  })

  it('stays hidden after bookmark list changes (the bug)', () => {
    const original = [bookmark({ id: 'bm-old', chapter: 5, paragraph: 10 })]
    const withNew = [...original, bookmark({ id: 'bm-new', chapter: 0, paragraph: 0 })]

    const params = { bookmarks: original, currentChapter: 0, currentParagraph: 0 }
    const { result, rerender } = renderHook(props => useRecoveryBanner(props), {
      initialProps: params,
    })

    // Dismiss the banner
    act(() => result.current.dismissBanner())
    expect(result.current.showBanner).toBe(false)

    // Add a bookmark at current position, then remove it
    rerender({ ...params, bookmarks: withNew })
    rerender({ ...params, bookmarks: original })

    // Banner should stay hidden — dismiss is permanent for the session
    expect(result.current.showBanner).toBe(false)
  })

  it('stays hidden when recovery bookmark is removed and a different one surfaces', () => {
    const params = {
      bookmarks: [
        bookmark({ id: 'bm-1', chapter: 5, paragraph: 10 }),
        bookmark({ id: 'bm-2', chapter: 3, paragraph: 0 }),
      ],
      currentChapter: 0,
      currentParagraph: 0,
    }
    const { result, rerender } = renderHook(props => useRecoveryBanner(props), {
      initialProps: params,
    })

    // Recovery target is bm-1 (furthest). Dismiss.
    expect(result.current.recoveryBookmark).toEqual(expect.objectContaining({ id: 'bm-1' }))
    act(() => result.current.dismissBanner())
    expect(result.current.showBanner).toBe(false)

    // Remove bm-1. bm-2 becomes recovery target.
    rerender({
      ...params,
      bookmarks: [bookmark({ id: 'bm-2', chapter: 3, paragraph: 0 })],
    })

    expect(result.current.recoveryBookmark).toEqual(expect.objectContaining({ id: 'bm-2' }))
    expect(result.current.showBanner).toBe(false)
  })

  it('picks the furthest bookmark as recovery target', () => {
    const { result } = renderHook(() =>
      useRecoveryBanner({
        bookmarks: [
          bookmark({ id: 'bm-early', chapter: 2, paragraph: 5 }),
          bookmark({ id: 'bm-far', chapter: 10, paragraph: 0 }),
          bookmark({ id: 'bm-mid', chapter: 5, paragraph: 3 }),
        ],
        currentChapter: 0,
        currentParagraph: 0,
      }),
    )

    expect(result.current.recoveryBookmark).toEqual(expect.objectContaining({ id: 'bm-far' }))
  })

  it('dismissBanner is referentially stable', () => {
    const { result, rerender } = renderHook(() =>
      useRecoveryBanner({
        bookmarks: [bookmark()],
        currentChapter: 0,
        currentParagraph: 0,
      }),
    )

    const first = result.current.dismissBanner

    rerender()
    expect(result.current.dismissBanner).toBe(first)
  })
})

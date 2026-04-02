import type { ChapterInfo } from '@/lib/types/book'
import { renderHook, waitFor } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePrefetchQueue } from './usePrefetchQueue'

const strictWrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>

const makeChapters = (paragraphCounts: number[]): ChapterInfo[] =>
  paragraphCounts.map((n, i) => ({
    title: `Chapter ${i}`,
    paragraphCount: n,
    wordCount: n * 10,
  }))

const stableOptions = () => {
  const chapters = makeChapters([5, 3])
  return {
    bookId: 'test-book',
    voice: 'narrator',
    chaptersRef: { current: chapters },
    currentChapterRef: { current: 0 },
    currentParagraphRef: { current: 0 },
    onDebugUpdate: vi.fn(),
  }
}

describe('usePrefetchQueue', () => {
  describe('callback referential stability', () => {
    const callbacks = [
      'fetchAudio',
      'continuePrefetching',
      'updateDebugMetrics',
      'resetFailures',
    ] as const

    callbacks.forEach(name => {
      it(`${name} is stable across re-renders`, () => {
        const opts = stableOptions()
        const { result, rerender } = renderHook(() => usePrefetchQueue(opts))
        const first = result.current[name]
        rerender()
        expect(result.current[name]).toBe(first)
      })
    })
  })

  describe('abort-on-unmount behavior', () => {
    let abortSpy: ReturnType<typeof vi.spyOn>
    let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>

    beforeEach(() => {
      abortSpy = vi.spyOn(AbortController.prototype, 'abort')
      fetchMock = vi.fn<typeof fetch>()
      global.fetch = fetchMock
    })

    afterEach(() => {
      abortSpy.mockRestore()
      vi.restoreAllMocks()
    })

    it('calls AbortController.abort() on unmount', () => {
      const opts = stableOptions()
      const { unmount } = renderHook(() => usePrefetchQueue(opts))

      expect(abortSpy).not.toHaveBeenCalled()
      unmount()
      expect(abortSpy).toHaveBeenCalled()
    })

    it('passes abort signal to fetch calls', async () => {
      // Use chapter with 2 paragraphs: current=0, will prefetch paragraph 1
      const chapters = makeChapters([2])
      const opts = {
        ...stableOptions(),
        chaptersRef: { current: chapters },
      }

      fetchMock.mockResolvedValue(
        new Response('', {
          status: 200,
          headers: new Headers({
            'X-Cache-Used': '1000000',
            'X-Cache-Max': '800000000',
          }),
        }),
      )

      const { result } = renderHook(() => usePrefetchQueue(opts))

      result.current.continuePrefetching()

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })

    it('does not increment consecutive failures on AbortError', async () => {
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'

      // Use 2 paragraphs: current=0, will try to prefetch paragraph 1
      const chapters = makeChapters([2])
      const opts = {
        ...stableOptions(),
        chaptersRef: { current: chapters },
      }

      let callCount = 0
      fetchMock.mockImplementation(() => {
        callCount++
        // First call fails with AbortError, second call succeeds
        if (callCount === 1) {
          return Promise.reject(abortError)
        }
        return Promise.resolve(
          new Response('', {
            status: 200,
            headers: new Headers({
              'X-Cache-Used': '1000000',
              'X-Cache-Max': '800000000',
            }),
          }),
        )
      })

      const { result } = renderHook(() => usePrefetchQueue(opts))

      // First attempt
      result.current.continuePrefetching()

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1)
      })

      // Second attempt on same paragraph should work
      // (proving AbortError didn't increment failures)
      result.current.continuePrefetching()

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2)
      })
    })

    it('does increment consecutive failures on non-abort errors', async () => {
      const networkError = new Error('Network error')

      // Use limited chapters
      const chapters = makeChapters([5])
      const opts = {
        ...stableOptions(),
        chaptersRef: { current: chapters },
      }

      fetchMock.mockRejectedValue(networkError)

      const { result } = renderHook(() => usePrefetchQueue(opts))

      // Trigger prefetching - it should stop after 3 failures
      result.current.continuePrefetching()

      await waitFor(
        () => {
          expect(fetchMock).toHaveBeenCalledTimes(3)
        },
        { timeout: 2000 },
      )

      // Wait a bit more to ensure it doesn't continue
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have stopped at 3 calls due to consecutive failure limit
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    it('stops prefetching after unmount', async () => {
      // Use limited chapters
      const chapters = makeChapters([3])
      const opts = {
        ...stableOptions(),
        chaptersRef: { current: chapters },
      }

      let callCount = 0
      fetchMock.mockImplementation(
        () =>
          new Promise(resolve => {
            callCount++
            setTimeout(
              () =>
                resolve(
                  new Response('', {
                    status: 200,
                    headers: new Headers({
                      'X-Cache-Used': '1000000',
                      'X-Cache-Max': '800000000',
                    }),
                  }),
                ),
              50,
            )
          }),
      )

      const { result, unmount } = renderHook(() => usePrefetchQueue(opts))

      result.current.continuePrefetching()

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

      const callCountBeforeUnmount = callCount

      unmount()

      // Wait to ensure no new fetches occur after unmount
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should not have made additional calls after unmount
      expect(callCount).toBe(callCountBeforeUnmount)
    })

    it('prefetches after StrictMode double-mount', async () => {
      const chapters = makeChapters([3])
      const opts = {
        ...stableOptions(),
        chaptersRef: { current: chapters },
      }

      fetchMock.mockResolvedValue(
        new Response('', {
          status: 200,
          headers: new Headers({
            'X-Cache-Used': '1000000',
            'X-Cache-Max': '800000000',
          }),
        }),
      )

      const { result } = renderHook(() => usePrefetchQueue(opts), {
        wrapper: strictWrapper,
      })

      result.current.continuePrefetching()

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled()
      })

      // Verify signal is NOT aborted (StrictMode resets the controller)
      const signal = fetchMock.mock.calls[0]?.[1]?.signal as AbortSignal
      expect(signal.aborted).toBe(false)
    })

    it('continues prefetching past 30 regardless of cache misses', async () => {
      // Regression: previously a single MISS would stop prefetching if ahead >= 30
      const chapters = makeChapters([45])
      const opts = {
        ...stableOptions(),
        chaptersRef: { current: chapters },
        currentChapterRef: { current: 0 },
        currentParagraphRef: { current: 0 },
      }

      const mockHeaders = new Headers({
        'X-Cache': 'MISS',
        'X-Cache-Used': '500000000',
        'X-Cache-Max': '800000000',
      })

      fetchMock.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          headers: mockHeaders,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        } as unknown as Response),
      )

      const { result } = renderHook(() => usePrefetchQueue(opts))

      result.current.continuePrefetching()

      await waitFor(
        () => {
          // All 44 paragraphs ahead (1 through 44) should be prefetched
          // even though they're all MISSes — old code would stop at 30
          expect(fetchMock).toHaveBeenCalledTimes(44)
        },
        { timeout: 10000 },
      )
    })

    it('passes abort signal to fetchAudio', async () => {
      fetchMock.mockResolvedValue(
        new Response('', {
          status: 200,
          headers: new Headers({
            'X-Cache-Used': '1000000',
            'X-Cache-Max': '800000000',
          }),
        }),
      )

      const opts = stableOptions()
      const { result } = renderHook(() => usePrefetchQueue(opts))

      await result.current.fetchAudio(0, 1)

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })
  })
})

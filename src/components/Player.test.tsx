import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Player } from './Player'
import { ParsedChapter } from '@/lib/epub'

// Mock the store
vi.mock('@/store/useStore', () => ({
  useStore: () => ({
    playbackSpeed: 1.0,
    setPlaybackSpeed: vi.fn(),
  }),
}))

// Mock Audio element
interface MockAudioInstance {
  src: string
  playbackRate: number
  onended: (() => void) | null
  onerror: (() => void) | null
  play: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
}

describe('Player', () => {
  let mockAudioInstance: MockAudioInstance
  let originalAudio: typeof Audio
  let fetchMock: ReturnType<typeof vi.fn>

  const createChapters = (sentenceCounts: number[]): ParsedChapter[] => {
    return sentenceCounts.map((count, idx) => ({
      title: `Chapter ${idx + 1}`,
      sentences: Array.from({ length: count }, (_, i) => `Sentence ${i + 1} of chapter ${idx + 1}`),
    }))
  }

  beforeEach(() => {
    // Store original Audio
    originalAudio = global.Audio

    // Create mock Audio instance that will be returned by the constructor
    mockAudioInstance = {
      src: '',
      playbackRate: 1,
      onended: null,
      onerror: null,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    }

    // Create a proper constructor function
    const MockAudioConstructor = function (this: MockAudioInstance) {
      Object.assign(this, mockAudioInstance)
      // Keep reference to the instance for tests
      mockAudioInstance = this
      return this
    } as unknown as typeof Audio

    global.Audio = MockAudioConstructor

    // Mock fetch for TTS API
    fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        headers: new Headers({
          'X-Cache': 'MISS',
          'X-Generation-Time-Ms': '100',
        }),
        blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/mpeg' })),
      })
    )
    global.fetch = fetchMock as typeof fetch

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    global.Audio = originalAudio
    vi.clearAllMocks()
  })

  describe('Bug 2: Stale closure in onended handler', () => {
    it('should use current position when onended fires, not stale closure values', async () => {
      const chapters = createChapters([10]) // 1 chapter with 10 sentences
      const onProgressChange = vi.fn()

      const { rerender } = render(
        <Player
          bookId="test-book"
          chapters={chapters}
          currentChapter={0}
          currentSentence={0}
          onProgressChange={onProgressChange}
        />
      )

      // Click play to initialize audio and set up handlers
      const playButton = screen.getByTitle('Play')
      await userEvent.click(playButton)

      // Wait for audio to be set up
      await waitFor(() => {
        expect(mockAudioInstance.play).toHaveBeenCalled()
      })

      // Simulate audio ended at sentence 0 - should advance to sentence 1
      act(() => {
        mockAudioInstance.onended?.()
      })

      expect(onProgressChange).toHaveBeenLastCalledWith(0, 1)

      // Now update props to sentence 5 (simulating user skipped ahead)
      rerender(
        <Player
          bookId="test-book"
          chapters={chapters}
          currentChapter={0}
          currentSentence={5}
          onProgressChange={onProgressChange}
        />
      )

      // Wait for rerender to complete
      await waitFor(() => {
        expect(screen.getByText(/Sentence 6 of 10/)).toBeInTheDocument()
      })

      // Clear previous calls
      onProgressChange.mockClear()

      // Simulate audio ended again - should advance from 5 to 6, NOT from 0 to 1
      act(() => {
        mockAudioInstance.onended?.()
      })

      // BUG: With stale closure, this would be called with (0, 1) instead of (0, 6)
      expect(onProgressChange).toHaveBeenCalledWith(0, 6)
    })

    it('should handle chapter boundary correctly with current position', async () => {
      const chapters = createChapters([3, 5]) // Chapter 0 has 3 sentences, Chapter 1 has 5
      const onProgressChange = vi.fn()

      const { rerender } = render(
        <Player
          bookId="test-book"
          chapters={chapters}
          currentChapter={0}
          currentSentence={2} // Start at last sentence of chapter 0
          onProgressChange={onProgressChange}
        />
      )

      // Click play - starts playing at sentence 2 (last sentence of chapter 0)
      const playButton = screen.getByTitle('Play')
      await userEvent.click(playButton)

      await waitFor(() => {
        expect(mockAudioInstance.play).toHaveBeenCalled()
      })

      // Audio ends - should advance to chapter 1, sentence 0
      act(() => {
        mockAudioInstance.onended?.()
      })

      expect(onProgressChange).toHaveBeenCalledWith(1, 0)
    })
  })

  describe('Bug 1: Audio not playing when fetch is pending', () => {
    it('should play audio after pending fetch completes', async () => {
      const chapters = createChapters([5])
      const onProgressChange = vi.fn()

      // Create a delayed fetch that we can control
      let resolveFetch: (value: Response) => void
      const delayedFetch = new Promise<Response>((resolve) => {
        resolveFetch = resolve
      })

      fetchMock.mockImplementationOnce(() => delayedFetch)

      render(
        <Player
          bookId="test-book"
          chapters={chapters}
          currentChapter={0}
          currentSentence={0}
          onProgressChange={onProgressChange}
        />
      )

      // Click play - this starts the fetch
      const playButton = screen.getByTitle('Play')
      await userEvent.click(playButton)

      // Fetch is pending, play was not called yet
      expect(mockAudioInstance.play).not.toHaveBeenCalled()

      // Click play again while fetch is still pending
      // This triggers the bug where fetchAudio returns null for pending fetches
      await userEvent.click(playButton) // This toggles to pause
      await userEvent.click(playButton) // This toggles back to play, triggering another playCurrentSentence

      // Now resolve the fetch
      await act(async () => {
        resolveFetch!({
          ok: true,
          headers: new Headers({
            'X-Cache': 'MISS',
            'X-Generation-Time-Ms': '100',
          }),
          blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/mpeg' })),
        } as Response)
      })

      // Wait for play to be called
      await waitFor(() => {
        expect(mockAudioInstance.play).toHaveBeenCalled()
      })
    })

    it('should return existing promise when fetch is already in progress', async () => {
      const chapters = createChapters([5])
      const onProgressChange = vi.fn()

      let fetchCallCount = 0
      let resolveFetch: (value: Response) => void

      fetchMock.mockImplementation(() => {
        fetchCallCount++
        if (fetchCallCount === 1) {
          // First call - return a promise we control
          return new Promise<Response>((resolve) => {
            resolveFetch = resolve
          })
        }
        // Subsequent calls - return immediately
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          blob: () => Promise.resolve(new Blob(['audio'])),
        })
      })

      render(
        <Player
          bookId="test-book"
          chapters={chapters}
          currentChapter={0}
          currentSentence={0}
          onProgressChange={onProgressChange}
        />
      )

      // Start playing - initiates first fetch
      const playButton = screen.getByTitle('Play')
      await userEvent.click(playButton)

      expect(fetchCallCount).toBe(1)

      // Pause and play again while fetch is pending
      await userEvent.click(playButton)
      await userEvent.click(playButton)

      // BUG: Without fix, this would make another fetch call.
      // With fix, it should reuse the pending promise and not make a new fetch.
      // However, current behavior returns null and doesn't play.

      // Resolve the first fetch
      await act(async () => {
        resolveFetch!({
          ok: true,
          headers: new Headers(),
          blob: () => Promise.resolve(new Blob(['audio'])),
        } as Response)
      })

      await waitFor(() => {
        expect(mockAudioInstance.play).toHaveBeenCalled()
      })

      // Should NOT have made a second fetch for the same sentence
      // (prefetch calls for other sentences are OK)
      const fetchCallsForSentence0 = fetchMock.mock.calls.filter(
        (call) => {
          const body = JSON.parse(call[1]?.body || '{}')
          return body.chapter === 0 && body.sentence === 0
        }
      )
      expect(fetchCallsForSentence0.length).toBe(1)
    })
  })

  describe('Basic playback', () => {
    it('should advance to next sentence on audio end', async () => {
      const chapters = createChapters([5])
      const onProgressChange = vi.fn()

      render(
        <Player
          bookId="test-book"
          chapters={chapters}
          currentChapter={0}
          currentSentence={2}
          onProgressChange={onProgressChange}
        />
      )

      const playButton = screen.getByTitle('Play')
      await userEvent.click(playButton)

      await waitFor(() => {
        expect(mockAudioInstance.play).toHaveBeenCalled()
      })

      act(() => {
        mockAudioInstance.onended?.()
      })

      expect(onProgressChange).toHaveBeenCalledWith(0, 3)
    })

    it('should stop at end of book', async () => {
      const chapters = createChapters([3]) // Single chapter with 3 sentences
      const onProgressChange = vi.fn()

      render(
        <Player
          bookId="test-book"
          chapters={chapters}
          currentChapter={0}
          currentSentence={2} // Last sentence
          onProgressChange={onProgressChange}
        />
      )

      const playButton = screen.getByTitle('Play')
      await userEvent.click(playButton)

      await waitFor(() => {
        expect(mockAudioInstance.play).toHaveBeenCalled()
      })

      act(() => {
        mockAudioInstance.onended?.()
      })

      // Should NOT call onProgressChange when at end of book
      expect(onProgressChange).not.toHaveBeenCalled()
    })
  })

  describe('Race condition: sentence skipping', () => {
    it('should not skip sentences when position changes during fetch', async () => {
      const chapters = createChapters([10])
      const onProgressChange = vi.fn()

      // Create a slow fetch for sentence 0, fast for others
      let resolveFirstFetch: (value: Response) => void
      let fetchCount = 0

      fetchMock.mockImplementation(() => {
        fetchCount++
        if (fetchCount === 1) {
          // First fetch (sentence 0) - slow
          return new Promise<Response>((resolve) => {
            resolveFirstFetch = resolve
          })
        }
        // Other fetches - immediate
        return Promise.resolve({
          ok: true,
          headers: new Headers(),
          blob: () => Promise.resolve(new Blob(['audio'])),
        })
      })

      const { rerender } = render(
        <Player
          bookId="test-book"
          chapters={chapters}
          currentChapter={0}
          currentSentence={0}
          onProgressChange={onProgressChange}
        />
      )

      // Start playing sentence 0
      const playButton = screen.getByTitle('Play')
      await userEvent.click(playButton)

      // While sentence 0 fetch is in progress, position changes to sentence 5
      // (simulating user skip or race condition)
      rerender(
        <Player
          bookId="test-book"
          chapters={chapters}
          currentChapter={0}
          currentSentence={5}
          onProgressChange={onProgressChange}
        />
      )

      // Wait for sentence 5 to start playing (fast fetch)
      await waitFor(() => {
        expect(mockAudioInstance.play).toHaveBeenCalled()
      })

      // Now resolve the first (slow) fetch for sentence 0
      await act(async () => {
        resolveFirstFetch!({
          ok: true,
          headers: new Headers(),
          blob: () => Promise.resolve(new Blob(['audio'])),
        } as Response)
      })

      onProgressChange.mockClear()

      // When audio ends, it should advance from sentence 5 to 6
      // NOT from sentence 0 to 1 (which would cause skipping)
      act(() => {
        mockAudioInstance.onended?.()
      })

      expect(onProgressChange).toHaveBeenCalledWith(0, 6)
    })
  })
})

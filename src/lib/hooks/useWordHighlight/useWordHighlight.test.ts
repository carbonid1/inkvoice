/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WordTimestamp } from '@/lib/types/wordTimestamp'
import { useWordHighlight } from './useWordHighlight'

// --- CSS Highlight API mock ---

const highlightSet = vi.fn()
const highlightDelete = vi.fn()

const stubHighlightAPI = () => {
  Object.defineProperty(globalThis, 'CSS', {
    value: { highlights: { set: highlightSet, delete: highlightDelete } },
    writable: true,
    configurable: true,
  })
  // @ts-expect-error — Highlight doesn't exist in jsdom
  globalThis.Highlight = class Highlight {
    ranges: Range[]
    constructor(...ranges: Range[]) {
      this.ranges = ranges
    }
  }
}

const clearHighlightAPI = () => {
  // @ts-expect-error — cleanup
  delete globalThis.CSS
  // @ts-expect-error — cleanup
  delete globalThis.Highlight
}

// --- helpers ---

const ts = (w: string, s: number, e: number): WordTimestamp => ({ w, s, e })

const makeTimestamps = (): WordTimestamp[] => [
  ts('Hello', 0, 0.3),
  ts('world', 0.4, 0.7),
  ts('test', 0.8, 1.1),
]

const makeParagraph = (text: string): HTMLSpanElement => {
  const el = document.createElement('span')

  el.textContent = text
  document.body.appendChild(el)
  return el
}

const makeAudio = (currentTime = 0.5): HTMLAudioElement => {
  const audio = document.createElement('audio')

  Object.defineProperty(audio, 'currentTime', { value: currentTime, writable: true })
  Object.defineProperty(audio, 'paused', { value: true, writable: true })
  return audio
}

describe('useWordHighlight', () => {
  beforeEach(() => {
    stubHighlightAPI()
  })

  afterEach(() => {
    clearHighlightAPI()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('clears highlight when timestamps become null', () => {
    const audioRef = { current: makeAudio() }
    const paragraphRef = { current: makeParagraph('Hello world test') }

    const initialProps: { timestamps: WordTimestamp[] | null } = { timestamps: makeTimestamps() }
    const { rerender } = renderHook(
      ({ timestamps }) =>
        useWordHighlight({
          audioRef,
          timestamps,
          paragraphRef,
          isPlaying: false,
        }),
      { initialProps },
    )

    highlightDelete.mockClear()

    rerender({ timestamps: null })

    expect(highlightDelete).toHaveBeenCalledWith('active-word')
  })

  it('keeps observer active when paused so DOM mutations reapply highlight', async () => {
    const audioRef = { current: makeAudio(0.5) }
    const paragraph = makeParagraph('Hello world test')
    const paragraphRef = { current: paragraph }
    const timestamps = makeTimestamps()

    // Start playing — sets activeIndexRef via initial word detection
    const { rerender } = renderHook(
      ({ isPlaying }) => useWordHighlight({ audioRef, timestamps, paragraphRef, isPlaying }),
      { initialProps: { isPlaying: true } },
    )

    // Pause — observer should remain active
    rerender({ isPlaying: false })

    highlightSet.mockClear()

    // Simulate DOM mutation (e.g. React re-render replacing innerHTML)
    paragraph.textContent = 'Hello world test'

    // MutationObserver fires asynchronously — flush microtasks
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(highlightSet).toHaveBeenCalledWith('active-word', expect.anything())
  })
})

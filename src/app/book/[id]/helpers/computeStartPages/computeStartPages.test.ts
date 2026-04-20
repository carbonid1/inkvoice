import { describe, expect, it } from 'vitest'
import { computeStartPages } from './computeStartPages'

describe('computeStartPages', () => {
  it('returns page 1 for single chapter', () => {
    expect(computeStartPages([350])).toEqual([1])
  })

  it('computes cumulative start pages across chapters', () => {
    // 350 words/page. Ch0=700w (2 pages), Ch1=350w (1 page), Ch2=175w (1 page)
    // Ch0 starts at page 1, Ch1 at page 3, Ch2 at page 4
    expect(computeStartPages([700, 350, 175])).toEqual([1, 3, 4])
  })

  it('returns empty array for empty input', () => {
    expect(computeStartPages([])).toEqual([])
  })

  it('handles zero-word chapters without skipping pages', () => {
    // Title-only chapters with 0 words shouldn't advance the page count
    expect(computeStartPages([350, 0, 350])).toEqual([1, 2, 2])
  })
})

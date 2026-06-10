import { describe, expect, it } from 'vitest'
import { computeGenerationRate } from './computeGenerationRate'

describe('computeGenerationRate', () => {
  it('computes paragraphs per second across the sample buffer', () => {
    const rate = computeGenerationRate([
      { at: 0, completedParagraphs: 100 },
      { at: 30_000, completedParagraphs: 110 },
      { at: 60_000, completedParagraphs: 130 },
    ])

    expect(rate).toBeCloseTo(0.5)
  })

  it('returns null with fewer than two samples', () => {
    expect(computeGenerationRate([])).toBeNull()
    expect(computeGenerationRate([{ at: 0, completedParagraphs: 5 }])).toBeNull()
  })

  it('returns null when the samples span too little time to be meaningful', () => {
    const rate = computeGenerationRate([
      { at: 0, completedParagraphs: 100 },
      { at: 1_000, completedParagraphs: 130 },
    ])

    expect(rate).toBeNull()
  })

  it('returns null when no forward progress was made', () => {
    const rate = computeGenerationRate([
      { at: 0, completedParagraphs: 100 },
      { at: 30_000, completedParagraphs: 100 },
    ])

    expect(rate).toBeNull()
  })
})

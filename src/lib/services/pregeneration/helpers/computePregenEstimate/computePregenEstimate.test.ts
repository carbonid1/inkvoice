import { describe, expect, it } from 'vitest'

import { computePregenEstimate } from './computePregenEstimate'

describe('computePregenEstimate', () => {
  it('subtracts cached paragraphs when estimating remaining work', () => {
    const full = computePregenEstimate({
      totalParagraphs: 1000,
      totalWords: 150000,
      cachedParagraphs: 0,
    })

    const partial = computePregenEstimate({
      totalParagraphs: 1000,
      totalWords: 150000,
      cachedParagraphs: 500,
    })

    expect(partial.estimatedSizeBytes).toBeLessThan(full.estimatedSizeBytes)
    expect(partial.estimatedGenerationMinutes).toBeLessThan(full.estimatedGenerationMinutes)
  })

  it('returns zero estimates when all paragraphs are already cached', () => {
    const result = computePregenEstimate({
      totalParagraphs: 500,
      totalWords: 75000,
      cachedParagraphs: 500,
    })

    expect(result.estimatedSizeBytes).toBe(0)
    expect(result.estimatedGenerationMinutes).toBe(0)
  })

  it('returns zero estimates for an empty book', () => {
    const result = computePregenEstimate({
      totalParagraphs: 0,
      totalWords: 0,
      cachedParagraphs: 0,
    })

    expect(result.estimatedSizeBytes).toBe(0)
    expect(result.estimatedGenerationMinutes).toBe(0)
  })
})

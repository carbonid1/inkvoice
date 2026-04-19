import { describe, expect, it } from 'vitest'

import { checkBudget } from './checkBudget'

describe('checkBudget', () => {
  it('returns ok when padded estimate fits within remaining budget', () => {
    const result = checkBudget({
      usedBytes: 100,
      maxBytes: 1000,
      estimatedBytes: 500,
    })

    // 500 * 1.15 = 575 → 100 + 575 = 675 ≤ 1000
    expect(result).toEqual({ ok: true })
  })

  it('returns shortfall when padded estimate exceeds remaining budget', () => {
    const result = checkBudget({
      usedBytes: 500,
      maxBytes: 1000,
      estimatedBytes: 500,
    })

    // 500 * 1.15 = 575 → 500 + 575 = 1075 > 1000 → shortfall 75
    expect(result).toEqual({
      ok: false,
      shortfallBytes: 75,
      requiredBytes: 575,
      usedBytes: 500,
      maxBytes: 1000,
    })
  })

  it('uses custom padding when provided', () => {
    const result = checkBudget({
      usedBytes: 0,
      maxBytes: 1000,
      estimatedBytes: 1000,
      padding: 0,
    })

    expect(result).toEqual({ ok: true })
  })

  it('returns ok for a zero estimate regardless of cache fullness', () => {
    const result = checkBudget({
      usedBytes: 1000,
      maxBytes: 1000,
      estimatedBytes: 0,
    })

    expect(result).toEqual({ ok: true })
  })
})

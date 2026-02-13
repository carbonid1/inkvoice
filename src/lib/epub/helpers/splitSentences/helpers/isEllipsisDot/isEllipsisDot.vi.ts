import { describe, expect, it } from 'vitest'
import { isEllipsisDot } from './isEllipsisDot'

describe('isEllipsisDot', () => {
  it('returns true for intermediate dot in spaced ellipsis', () => {
    // "hello. . . world" — dots at 5, 7, 9
    const ranges = [{ start: 5, end: 10 }]
    expect(isEllipsisDot(5, ranges, 'world')).toBe(true)
    expect(isEllipsisDot(7, ranges, 'world')).toBe(true)
  })

  it('returns true for last dot when lowercase follows', () => {
    const ranges = [{ start: 5, end: 10 }]
    expect(isEllipsisDot(9, ranges, 'world')).toBe(true)
  })

  it('returns false for last dot when uppercase follows', () => {
    const ranges = [{ start: 5, end: 10 }]
    expect(isEllipsisDot(9, ranges, 'World')).toBe(false)
  })

  it('returns false for last dot when opening quote follows', () => {
    const ranges = [{ start: 5, end: 10 }]
    expect(isEllipsisDot(9, ranges, '"What?"')).toBe(false)
    expect(isEllipsisDot(9, ranges, '\u201cWhat?\u201d')).toBe(false)
  })

  it('returns false for dot outside any ellipsis range', () => {
    const ranges = [{ start: 10, end: 15 }]
    expect(isEllipsisDot(5, ranges, 'anything')).toBe(false)
  })

  it('handles multi-dot range', () => {
    // "hello... world" — dots at 5, 6, 7
    const ranges = [{ start: 5, end: 8 }]
    expect(isEllipsisDot(5, ranges, 'world')).toBe(true)
    expect(isEllipsisDot(6, ranges, 'world')).toBe(true)
    expect(isEllipsisDot(7, ranges, 'world')).toBe(true) // last, lowercase
    expect(isEllipsisDot(7, ranges, 'World')).toBe(false) // last, uppercase
  })
})

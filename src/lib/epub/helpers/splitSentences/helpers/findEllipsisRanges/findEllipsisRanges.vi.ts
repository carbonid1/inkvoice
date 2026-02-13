import { describe, expect, it } from 'vitest'
import { findEllipsisRanges } from './findEllipsisRanges'

describe('findEllipsisRanges', () => {
  it('detects spaced ellipsis ". . ."', () => {
    const ranges = findEllipsisRanges('hello. . . world')
    expect(ranges).toEqual([{ start: 5, end: 10 }])
  })

  it('detects extended spaced ellipsis ". . . . ."', () => {
    const ranges = findEllipsisRanges('hello. . . . . world')
    expect(ranges).toEqual([{ start: 5, end: 14 }])
  })

  it('detects multi-dot "..."', () => {
    const ranges = findEllipsisRanges('hello... world')
    expect(ranges).toEqual([{ start: 5, end: 8 }])
  })

  it('returns empty for no ellipsis', () => {
    expect(findEllipsisRanges('Hello world.')).toEqual([])
  })
})

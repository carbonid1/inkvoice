import { describe, expect, it } from 'vitest'
import { findMatchPositions } from './findMatchPositions'

describe('findMatchPositions', () => {
  it('returns empty array when no matches', () => {
    expect(findMatchPositions('hello world', 'xyz')).toEqual([])
  })

  it('finds a single match', () => {
    expect(findMatchPositions('hello world', 'world')).toEqual([6])
  })

  it('finds multiple non-overlapping matches', () => {
    expect(findMatchPositions('the cat sat on the mat', 'the')).toEqual([0, 15])
  })

  it('matches case-insensitively', () => {
    expect(findMatchPositions('Hello HELLO hello', 'hello')).toEqual([0, 6, 12])
  })

  it('handles special regex characters in query', () => {
    expect(findMatchPositions('price is $5.00 (USD)', '$5.00')).toEqual([9])
  })

  it('handles parentheses in query', () => {
    expect(findMatchPositions('call foo() and bar()', 'foo()')).toEqual([5])
  })

  it('returns non-overlapping positions', () => {
    // "aa" in "aaaa" should match at 0 and 2, not 0, 1, 2
    expect(findMatchPositions('aaaa', 'aa')).toEqual([0, 2])
  })

  it('returns empty array for empty query', () => {
    expect(findMatchPositions('hello', '')).toEqual([])
  })
})

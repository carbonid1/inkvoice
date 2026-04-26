import { describe, expect, it } from 'vitest'
import type { WordTimestamp } from '@/lib/types/wordTimestamp'
import { findActiveWord } from './findActiveWord'

const timestamps: WordTimestamp[] = [
  { w: 'Hello', s: 0.0, e: 0.3 },
  { w: 'world', s: 0.35, e: 0.7 },
  { w: 'this', s: 0.75, e: 1.0 },
  { w: 'is', s: 1.05, e: 1.2 },
  { w: 'a', s: 1.25, e: 1.3 },
  { w: 'test', s: 1.35, e: 1.8 },
]

describe('findActiveWord', () => {
  it('returns -1 for empty timestamps', () => {
    expect(findActiveWord(0.5, [])).toBe(-1)
  })

  it('returns 0 for time before first word', () => {
    expect(findActiveWord(-0.1, timestamps)).toBe(0)
  })

  it('returns last index for time after last word', () => {
    expect(findActiveWord(5.0, timestamps)).toBe(5)
  })

  it('finds correct word mid-sentence', () => {
    expect(findActiveWord(0.5, timestamps)).toBe(1) // "world" 0.35-0.7
    expect(findActiveWord(0.8, timestamps)).toBe(2) // "this" 0.75-1.0
    expect(findActiveWord(1.1, timestamps)).toBe(3) // "is" 1.05-1.2
  })

  it('returns word at start boundary', () => {
    expect(findActiveWord(0.0, timestamps)).toBe(0) // "Hello" starts at 0.0
    expect(findActiveWord(0.35, timestamps)).toBe(1) // "world" starts at 0.35
  })

  it('returns previous word in gap outside lookahead', () => {
    // Gap between "Hello" (ends 0.3) and "world" (starts 0.35)
    // 0.31 + 0.03 lookahead = 0.34, still < 0.35 → previous word
    expect(findActiveWord(0.31, timestamps)).toBe(0)
  })

  it('applies lookahead for smoother transitions', () => {
    // 0.32 + 0.03 = 0.35 which equals world.s → lookahead snaps to "world"
    expect(findActiveWord(0.32, timestamps)).toBe(1)
  })
})

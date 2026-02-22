import { describe, expect, it } from 'vitest'
import { countWords } from './countWords'

describe('countWords', () => {
  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0)
  })

  it('returns 0 for whitespace-only string', () => {
    expect(countWords('   ')).toBe(0)
  })

  it('counts single word', () => {
    expect(countWords('hello')).toBe(1)
  })

  it('counts multiple words', () => {
    expect(countWords('the quick brown fox')).toBe(4)
  })

  it('handles multiple spaces between words', () => {
    expect(countWords('hello   world')).toBe(2)
  })

  it('handles leading and trailing whitespace', () => {
    expect(countWords('  hello world  ')).toBe(2)
  })

  it('handles newlines and tabs', () => {
    expect(countWords('hello\nworld\tfoo')).toBe(3)
  })
})

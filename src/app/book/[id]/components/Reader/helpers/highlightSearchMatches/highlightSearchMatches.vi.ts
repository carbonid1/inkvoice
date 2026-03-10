import { describe, expect, it } from 'vitest'
import { highlightSearchMatches } from './highlightSearchMatches'

describe('highlightSearchMatches', () => {
  it('returns unchanged HTML for empty query', () => {
    expect(highlightSearchMatches('hello world', '')).toBe('hello world')
  })

  it('highlights match in plain text', () => {
    const result = highlightSearchMatches('hello world', 'world')
    expect(result).toContain('<mark')
    expect(result).toContain('world</mark>')
    expect(result).toContain('bg-orange-200')
  })

  it('highlights match inside an HTML tag', () => {
    const result = highlightSearchMatches('<em>hello world</em>', 'world')
    expect(result).toContain('<mark')
    expect(result).toContain('world</mark>')
    // Should not break the em tag
    expect(result).toContain('<em>')
    expect(result).toContain('</em>')
  })

  it('highlights match spanning across tag boundary', () => {
    const result = highlightSearchMatches('<em>hello wo</em>rld', 'world')
    expect(result).toContain('<mark')
    // The word "world" is split: "wo" in <em> and "rld" outside
    // Both parts should be wrapped in <mark>
    expect(result).toMatch(/wo<\/mark><\/em><mark[^>]*>rld<\/mark>/)
  })

  it('highlights multiple matches in one segment', () => {
    const result = highlightSearchMatches('the cat and the dog', 'the')
    const markCount = (result.match(/<mark/g) ?? []).length
    expect(markCount).toBe(2)
  })

  it('uses active match class when isActiveMatch is true', () => {
    const result = highlightSearchMatches('hello world', 'world', true)
    expect(result).toContain('bg-orange-400')
  })

  it('uses inactive match class when isActiveMatch is false', () => {
    const result = highlightSearchMatches('hello world', 'world', false)
    expect(result).toContain('bg-orange-200')
  })

  it('preserves HTML entities inside match', () => {
    const result = highlightSearchMatches('A &amp; B', 'A & B')
    expect(result).toContain('<mark')
  })

  it('handles special regex characters in query', () => {
    const result = highlightSearchMatches('price is $5.00', '$5.00')
    expect(result).toContain('<mark')
    expect(result).toContain('$5.00</mark>')
  })
})

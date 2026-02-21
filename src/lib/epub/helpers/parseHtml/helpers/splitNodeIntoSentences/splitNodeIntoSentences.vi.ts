import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { splitNodeIntoSentences } from './splitNodeIntoSentences'

const makeElement = (html: string): Element => {
  const dom = new JSDOM(html)
  return dom.window.document.body.firstElementChild!
}

describe('splitNodeIntoSentences', () => {
  it('should return single mapping for one sentence', () => {
    const el = makeElement('<p>Hello brave world.</p>')
    const result = splitNodeIntoSentences(el)

    expect(result).toHaveLength(1)
    expect(result[0]?.plainText).toBe('Hello brave world.')
  })

  it('should split multiple sentences', () => {
    const el = makeElement('<p>First sentence. Second sentence.</p>')
    const result = splitNodeIntoSentences(el)

    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0]?.plainText).toContain('First sentence.')
  })

  it('should return empty array for empty node', () => {
    const el = makeElement('<p>   </p>')
    const result = splitNodeIntoSentences(el)

    expect(result).toHaveLength(0)
  })

  it('should preserve HTML across sentence boundaries', () => {
    const el = makeElement('<p>She walked <em>fourteen leagues</em> north. Then she rested.</p>')
    const result = splitNodeIntoSentences(el)

    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0]?.html).toContain('<em>')
  })
})

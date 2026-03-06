import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { splitNodeIntoChunks } from './splitNodeIntoChunks'

const makeElement = (html: string): Element => {
  const dom = new JSDOM(html)
  return dom.window.document.body.firstElementChild!
}

describe('splitNodeIntoChunks', () => {
  it('returns entire paragraph as single chunk', () => {
    const el = makeElement('<p>First sentence. Second sentence. Third sentence.</p>')
    const result = splitNodeIntoChunks(el)

    expect(result).toHaveLength(1)
    expect(result[0]?.plainText).toBe('First sentence. Second sentence. Third sentence.')
  })

  it('preserves all HTML in single chunk', () => {
    const el = makeElement('<p>She walked <em>fourteen leagues</em> north. Then she rested.</p>')
    const result = splitNodeIntoChunks(el)

    expect(result).toHaveLength(1)
    expect(result[0]?.html).toContain('<em>')
    expect(result[0]?.plainText).toBe('She walked fourteen leagues north. Then she rested.')
  })

  it('returns empty array for empty node', () => {
    const el = makeElement('<p>   </p>')
    const result = splitNodeIntoChunks(el)

    expect(result).toHaveLength(0)
  })
})

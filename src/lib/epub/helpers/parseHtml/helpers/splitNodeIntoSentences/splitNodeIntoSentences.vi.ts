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

  it('keeps dialogue attribution with closing quote as one sentence', () => {
    const el = makeElement(
      '<p>Iskaral Pust eased back into the chamber. &#x2018;Why are you here?&#x2019; he whispered. &#x2018;Do you know why?</p>',
    )
    const result = splitNodeIntoSentences(el)

    expect(result).toHaveLength(2)
    expect(result[0]?.plainText).toBe('Iskaral Pust eased back into the chamber.')
    expect(result[1]?.plainText).toBe(
      '\u2018Why are you here?\u2019 he whispered. \u2018Do you know why?',
    )
  })

  it('should preserve HTML across sentence boundaries', () => {
    const el = makeElement('<p>She walked <em>fourteen leagues</em> north. Then she rested.</p>')
    const result = splitNodeIntoSentences(el)

    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0]?.html).toContain('<em>')
  })
})

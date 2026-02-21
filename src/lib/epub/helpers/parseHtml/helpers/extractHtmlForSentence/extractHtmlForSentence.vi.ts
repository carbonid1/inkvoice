import { describe, expect, it } from 'vitest'
import { extractHtmlForSentence } from './extractHtmlForSentence'

describe('extractHtmlForSentence', () => {
  it('should handle entity decoding', () => {
    const html = 'Hello &amp; world.'
    const result = extractHtmlForSentence(html, 'Hello & world.')
    expect(result).toBe('Hello &amp; world.')
  })

  it('should skip tags when matching', () => {
    const html = 'Hello <em>brave</em> world.'
    const result = extractHtmlForSentence(html, 'Hello brave world.')
    expect(result).toBe('Hello <em>brave</em> world.')
  })

  it('should include trailing close tags', () => {
    const html = '<em>Hello world.</em> Next sentence.'
    const result = extractHtmlForSentence(html, 'Hello world.')
    expect(result).toBe('<em>Hello world.</em>')
  })

  it('should handle whitespace normalization', () => {
    const html = 'Hello   world.'
    const result = extractHtmlForSentence(html, 'Hello world.')
    expect(result).toBe('Hello   world.')
  })
})

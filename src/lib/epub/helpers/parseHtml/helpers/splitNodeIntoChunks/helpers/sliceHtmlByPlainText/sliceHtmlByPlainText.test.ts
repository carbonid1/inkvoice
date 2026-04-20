import { describe, expect, it } from 'vitest'
import { sliceHtmlByPlainText } from './sliceHtmlByPlainText'

describe('sliceHtmlByPlainText', () => {
  it('slices plain text with no tags', () => {
    const html = 'First sentence. Second sentence.'
    const chunks = ['First sentence.', 'Second sentence.']

    const result = sliceHtmlByPlainText(html, chunks)

    expect(result).toEqual(['First sentence.', 'Second sentence.'])
  })

  it('preserves em tag within one chunk', () => {
    const html = 'She walked <em>fourteen leagues</em> north. Then she rested.'
    const chunks = ['She walked fourteen leagues north.', 'Then she rested.']

    const result = sliceHtmlByPlainText(html, chunks)

    expect(result[0]).toBe('She walked <em>fourteen leagues</em> north.')
    expect(result[1]).toBe('Then she rested.')
  })

  it('closes and reopens em tag spanning chunk boundary', () => {
    const html = 'The road was <em>long and dangerous. She kept walking</em> anyway.'
    const chunks = ['The road was long and dangerous.', 'She kept walking anyway.']

    const result = sliceHtmlByPlainText(html, chunks)

    expect(result[0]).toBe('The road was <em>long and dangerous.</em>')
    expect(result[1]).toBe('<em>She kept walking</em> anyway.')
  })

  it('handles nested tags at chunk boundary', () => {
    const html = '<em>The <strong>bold path</strong> was clear. She followed it</em> home.'
    const chunks = ['The bold path was clear.', 'She followed it home.']

    const result = sliceHtmlByPlainText(html, chunks)

    expect(result[0]).toBe('<em>The <strong>bold path</strong> was clear.</em>')
    expect(result[1]).toBe('<em>She followed it</em> home.')
  })

  it('handles HTML entities', () => {
    const html = 'The Empire&rsquo;s army fell. Victory was hollow.'
    const chunks = ['The Empire\u2019s army fell.', 'Victory was hollow.']

    const result = sliceHtmlByPlainText(html, chunks)

    expect(result[0]).toBe('The Empire&rsquo;s army fell.')
    expect(result[1]).toBe('Victory was hollow.')
  })
})

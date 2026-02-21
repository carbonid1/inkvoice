import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { getInnerHtml } from './getInnerHtml'

const makeElement = (html: string): Element => {
  const dom = new JSDOM(html)
  return dom.window.document.body.firstElementChild!
}

describe('getInnerHtml', () => {
  it('should preserve inline formatting tags', () => {
    const el = makeElement('<p>Hello <em>world</em></p>')
    expect(getInnerHtml(el)).toBe('Hello <em>world</em>')
  })

  it('should strip internal links but keep text', () => {
    const el = makeElement('<p>See <a href="../chapter1.html">here</a> for more.</p>')
    expect(getInnerHtml(el)).toBe('See here for more.')
  })

  it('should preserve external links', () => {
    const el = makeElement('<p>Visit <a href="http://example.com">site</a></p>')
    expect(getInnerHtml(el)).toBe('Visit <a href="http://example.com">site</a>')
  })

  it('should handle void elements', () => {
    const el = makeElement('<p>Line one<br/>Line two</p>')
    expect(getInnerHtml(el)).toBe('Line one<br/>Line two')
  })

  it('should escape entities in text nodes', () => {
    const dom = new JSDOM('<p></p>')
    const p = dom.window.document.querySelector('p')!
    p.appendChild(dom.window.document.createTextNode('a < b & c > d'))
    expect(getInnerHtml(p)).toBe('a &lt; b &amp; c &gt; d')
  })
})

import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { getPlainText } from './getPlainText'

const makeNode = (html: string): Node => {
  const dom = new JSDOM(html)

  return dom.window.document.body
}

describe('getPlainText', () => {
  it('should extract text from text nodes', () => {
    const node = makeNode('Hello world')

    expect(getPlainText(node)).toBe('Hello world')
  })

  it('should recurse through element nodes', () => {
    const node = makeNode('<p>Hello <em>world</em></p>')

    expect(getPlainText(node)).toBe('Hello world')
  })

  it('should skip script elements', () => {
    const node = makeNode('<p>Hello</p><script>alert("x")</script><p>World</p>')

    expect(getPlainText(node)).toBe('HelloWorld')
  })

  it('should skip style elements', () => {
    const node = makeNode('<style>.x { color: red; }</style><p>Content</p>')

    expect(getPlainText(node)).toBe('Content')
  })

  it('should convert br to space', () => {
    const node = makeNode('<p>Line one<br/>Line two</p>')

    expect(getPlainText(node)).toBe('Line one Line two')
  })
})

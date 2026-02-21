import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { isAttributionElement } from './isAttributionElement'

const makeElement = (html: string): Element => {
  const dom = new JSDOM(html)
  return dom.window.document.body.firstElementChild!
}

describe('isAttributionElement', () => {
  it('should detect p.r with text content', () => {
    expect(isAttributionElement(makeElement('<p class="r">Author Name</p>'))).toBe(true)
  })

  it('should reject p.r with only nbsp', () => {
    expect(isAttributionElement(makeElement('<p class="r">\u00a0</p>'))).toBe(false)
  })

  it('should reject p.r with only whitespace', () => {
    expect(isAttributionElement(makeElement('<p class="r">   </p>'))).toBe(false)
  })

  it('should reject elements without class r', () => {
    expect(isAttributionElement(makeElement('<p class="other">Text</p>'))).toBe(false)
  })
})

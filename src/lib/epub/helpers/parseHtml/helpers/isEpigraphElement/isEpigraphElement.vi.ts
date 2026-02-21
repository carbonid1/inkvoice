import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { isEpigraphElement } from './isEpigraphElement'

const makeElement = (html: string): Element => {
  const dom = new JSDOM(html)
  return dom.window.document.body.firstElementChild!
}

describe('isEpigraphElement', () => {
  it('should match totalind', () => {
    expect(isEpigraphElement(makeElement('<p class="totalind">text</p>'))).toBe(true)
  })

  it('should match totalfirst', () => {
    expect(isEpigraphElement(makeElement('<p class="totalfirst">text</p>'))).toBe(true)
  })

  it('should match totalsecond', () => {
    expect(isEpigraphElement(makeElement('<p class="totalsecond">text</p>'))).toBe(true)
  })

  it('should match totalsecondfirst', () => {
    expect(isEpigraphElement(makeElement('<p class="totalsecondfirst">text</p>'))).toBe(true)
  })

  it('should match totalthree', () => {
    expect(isEpigraphElement(makeElement('<p class="totalthree">text</p>'))).toBe(true)
  })

  it('should not match unrelated classes', () => {
    expect(isEpigraphElement(makeElement('<p class="indent">text</p>'))).toBe(false)
  })

  it('should match among multiple classes', () => {
    expect(isEpigraphElement(makeElement('<p class="indent totalind">text</p>'))).toBe(true)
  })
})

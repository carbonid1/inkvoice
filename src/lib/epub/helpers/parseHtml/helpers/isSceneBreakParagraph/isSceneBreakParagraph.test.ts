import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { isSceneBreakParagraph } from './isSceneBreakParagraph'

const makeElement = (html: string): Element => {
  const dom = new JSDOM(html)

  return dom.window.document.body.firstElementChild!
}

describe('isSceneBreakParagraph', () => {
  it('should detect <p>&nbsp;</p>', () => {
    expect(isSceneBreakParagraph(makeElement('<p>&nbsp;</p>'))).toBe(true)
  })

  it('should detect whitespace-only <p>', () => {
    expect(isSceneBreakParagraph(makeElement('<p>   </p>'))).toBe(true)
  })

  it('should detect truly empty <p>', () => {
    expect(isSceneBreakParagraph(makeElement('<p></p>'))).toBe(true)
  })

  it('should detect a dash-only <p>', () => {
    expect(isSceneBreakParagraph(makeElement('<p>—</p>'))).toBe(true)
  })

  it('should detect an asterism <p>', () => {
    expect(isSceneBreakParagraph(makeElement('<p>* * *</p>'))).toBe(true)
  })

  it('should reject <p> with text', () => {
    expect(isSceneBreakParagraph(makeElement('<p>Real content.</p>'))).toBe(false)
  })

  it('should reject <p> with a number', () => {
    expect(isSceneBreakParagraph(makeElement('<p>42</p>'))).toBe(false)
  })

  it('should reject image-only <p>', () => {
    expect(isSceneBreakParagraph(makeElement('<p><img src="x.png"/></p>'))).toBe(false)
  })
})

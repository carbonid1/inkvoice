import { describe, expect, it } from 'vitest'
import { isFilenameAlt } from './isFilenameAlt'

describe('isFilenameAlt', () => {
  it('should detect .jpg filenames', () => {
    expect(isFilenameAlt('large epub_Gates_02.jpg')).toBe(true)
  })

  it('should detect .png filenames', () => {
    expect(isFilenameAlt('map.png')).toBe(true)
  })

  it('should detect .jpeg filenames', () => {
    expect(isFilenameAlt('cover.jpeg')).toBe(true)
  })

  it('should not flag descriptive alt text', () => {
    expect(isFilenameAlt('A detailed map of Seven Cities')).toBe(false)
  })

  it('should not flag alt text with periods mid-sentence', () => {
    expect(isFilenameAlt('Map of Dr. Smith region')).toBe(false)
  })

  it('should not flag the word cover', () => {
    expect(isFilenameAlt('cover')).toBe(false)
  })
})

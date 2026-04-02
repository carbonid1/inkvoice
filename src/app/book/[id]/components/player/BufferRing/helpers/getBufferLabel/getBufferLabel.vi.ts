import { describe, expect, it } from 'vitest'
import { getBufferLabel } from './getBufferLabel'

describe('getBufferLabel', () => {
  it('shows generating message when ahead is 0 and generating', () => {
    expect(getBufferLabel(0, true)).toBe('Generating first paragraphs...')
  })

  it('shows count with generating suffix when generating', () => {
    expect(getBufferLabel(42, true)).toBe('42 paragraphs ready \u00b7 Generating...')
  })

  it('shows count without suffix when idle', () => {
    expect(getBufferLabel(42, false)).toBe('42 paragraphs ready')
  })

  it('shows buffer full when at max', () => {
    expect(getBufferLabel(120, false)).toBe('Buffer full')
  })

  it('shows singular form for 1 paragraph', () => {
    expect(getBufferLabel(1, false)).toBe('1 paragraph ready')
  })
})

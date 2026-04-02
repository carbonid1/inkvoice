import { describe, expect, it } from 'vitest'
import { getBufferColor } from './getBufferColor'

describe('getBufferColor', () => {
  it('returns cold color when ahead is 0', () => {
    expect(getBufferColor(0)).toBe('text-muted-foreground/40')
  })

  it('returns warming color for 1–10 paragraphs ahead', () => {
    expect(getBufferColor(1)).toBe('text-muted-foreground')
    expect(getBufferColor(10)).toBe('text-muted-foreground')
  })

  it('returns ready color for 11–60 paragraphs ahead', () => {
    expect(getBufferColor(11)).toBe('text-primary')
    expect(getBufferColor(60)).toBe('text-primary')
  })

  it('returns full color for 61+ paragraphs ahead', () => {
    expect(getBufferColor(61)).toBe('text-success')
    expect(getBufferColor(120)).toBe('text-success')
  })
})

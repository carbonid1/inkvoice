import { describe, expect, it } from 'vitest'
import { formatBytes } from './formatBytes'

describe('formatBytes', () => {
  it('formats bytes under 1 MB as "1 MB"', () => {
    expect(formatBytes(0)).toBe('1 MB')
    expect(formatBytes(500_000)).toBe('1 MB')
  })

  it('formats megabytes with no decimals', () => {
    expect(formatBytes(1_048_576)).toBe('1 MB')
    expect(formatBytes(512 * 1024 * 1024)).toBe('512 MB')
  })

  it('formats gigabytes with one decimal', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB')
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB')
  })
})

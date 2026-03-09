import { afterEach, describe, expect, it, vi } from 'vitest'
import { getModKey } from './getModKey'

describe('getModKey', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns "Cmd" on Mac', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' })
    expect(getModKey()).toBe('Cmd')
  })

  it('returns "Ctrl" on Windows', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })
    expect(getModKey()).toBe('Ctrl')
  })

  it('returns "Ctrl" when navigator is undefined', () => {
    vi.stubGlobal('navigator', undefined)
    expect(getModKey()).toBe('Ctrl')
  })
})

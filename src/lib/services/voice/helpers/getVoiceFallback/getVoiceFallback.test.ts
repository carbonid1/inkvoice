import { describe, expect, it } from 'vitest'
import { getVoiceFallback } from './getVoiceFallback'

describe('getVoiceFallback', () => {
  it('returns requested voice when it exists in available list', () => {
    expect(getVoiceFallback('casual', ['narrator', 'casual'])).toBe('casual')
  })

  it('falls back to narrator when requested voice is missing', () => {
    expect(getVoiceFallback('deleted', ['narrator', 'casual'])).toBe('narrator')
  })

  it('falls back to first available when narrator is also missing', () => {
    expect(getVoiceFallback('deleted', ['announcer', 'casual'])).toBe('announcer')
  })

  it('returns requested voice when available list is empty', () => {
    expect(getVoiceFallback('casual', [])).toBe('casual')
  })
})

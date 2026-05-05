import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { voiceSampleEvents } from './voiceSampleEvents.service'

describe('voiceSampleEvents', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('delivers published events to live subscribers', () => {
    const listener = vi.fn()

    voiceSampleEvents.on(listener)
    voiceSampleEvents.publish('voice-a', 'ready')

    expect(listener).toHaveBeenCalledWith({
      type: 'sample',
      voiceName: 'voice-a',
      status: 'ready',
    })
    voiceSampleEvents.off(listener)
  })

  it('stops delivering after unsubscribe', () => {
    const listener = vi.fn()

    voiceSampleEvents.on(listener)
    voiceSampleEvents.off(listener)
    voiceSampleEvents.publish('voice-a', 'ready')

    expect(listener).not.toHaveBeenCalled()
  })

  it('retains the latest outcome per voice for late subscribers', () => {
    voiceSampleEvents.publish('voice-a', 'ready')
    voiceSampleEvents.publish('voice-b', 'failed')

    const recent = voiceSampleEvents.getRecent()

    expect(recent).toEqual(
      expect.arrayContaining([
        { type: 'sample', voiceName: 'voice-a', status: 'ready' },
        { type: 'sample', voiceName: 'voice-b', status: 'failed' },
      ]),
    )
  })

  it('keeps only the latest outcome per voice', () => {
    voiceSampleEvents.publish('voice-a', 'ready')
    voiceSampleEvents.publish('voice-a', 'failed')

    const recent = voiceSampleEvents.getRecent()
    const entries = recent.filter(e => e.voiceName === 'voice-a')

    expect(entries).toHaveLength(1)
    expect(entries[0]?.status).toBe('failed')
  })

  it('expires recent outcomes after the TTL', () => {
    voiceSampleEvents.publish('voice-a', 'ready')

    expect(voiceSampleEvents.getRecent().some(e => e.voiceName === 'voice-a')).toBe(true)

    vi.advanceTimersByTime(5 * 60 * 1000 + 1)

    expect(voiceSampleEvents.getRecent().some(e => e.voiceName === 'voice-a')).toBe(false)
  })
})

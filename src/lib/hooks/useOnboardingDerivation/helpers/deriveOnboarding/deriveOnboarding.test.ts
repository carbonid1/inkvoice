import { describe, expect, it } from 'vitest'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import { deriveOnboarding } from './deriveOnboarding'

const baseInput = {
  loaded: true,
  voice: DEFAULT_VOICE,
  jobCount: 0,
  dismissed: false,
  manuallyCompleted: { voice: false, pregen: false },
}

describe('voice step', () => {
  it('is done when the user picked a non-default voice', () => {
    const { done } = deriveOnboarding({ ...baseInput, voice: 'jonathan' })

    expect(done.has('voice')).toBe(true)
  })

  it('is done when manually marked complete even on the default voice', () => {
    const { done } = deriveOnboarding({
      ...baseInput,
      manuallyCompleted: { ...baseInput.manuallyCompleted, voice: true },
    })

    expect(done.has('voice')).toBe(true)
  })

  it('is incomplete on the default voice with nothing manually marked', () => {
    const { done } = deriveOnboarding(baseInput)

    expect(done.has('voice')).toBe(false)
  })
})

describe('pregen step', () => {
  it('is done when at least one pregeneration job exists', () => {
    const { done } = deriveOnboarding({ ...baseInput, jobCount: 1 })

    expect(done.has('pregen')).toBe(true)
  })

  it('is done when manually marked complete', () => {
    const { done } = deriveOnboarding({
      ...baseInput,
      manuallyCompleted: { ...baseInput.manuallyCompleted, pregen: true },
    })

    expect(done.has('pregen')).toBe(true)
  })

  it('is incomplete with no jobs and nothing manual', () => {
    const { done } = deriveOnboarding(baseInput)

    expect(done.has('pregen')).toBe(false)
  })
})

describe('visibility', () => {
  it('is hidden until the onboarding store finishes loading', () => {
    const { visible } = deriveOnboarding({ ...baseInput, loaded: false })

    expect(visible).toBe(false)
  })

  it('is hidden when the user has dismissed the panel', () => {
    const { visible } = deriveOnboarding({ ...baseInput, dismissed: true })

    expect(visible).toBe(false)
  })

  it('is hidden once all steps are done', () => {
    const { visible } = deriveOnboarding({
      ...baseInput,
      voice: 'jonathan',
      jobCount: 1,
    })

    expect(visible).toBe(false)
  })

  it('is shown when loaded, not dismissed, and at least one step is pending', () => {
    const { visible } = deriveOnboarding(baseInput)

    expect(visible).toBe(true)
  })
})

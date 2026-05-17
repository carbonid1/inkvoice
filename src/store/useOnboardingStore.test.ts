import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOnboardingStore } from './useOnboardingStore'

beforeEach(() => {
  useOnboardingStore.setState({
    dismissed: false,
    manuallyCompleted: { voice: false, pregen: false },
    loaded: false,
  })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('defaults', () => {
  it('starts not dismissed with all steps incomplete and not loaded', () => {
    const state = useOnboardingStore.getState()

    expect(state.dismissed).toBe(false)
    expect(state.manuallyCompleted).toEqual({ voice: false, pregen: false })
    expect(state.loaded).toBe(false)
  })
})

describe('setDismissed', () => {
  it('flips the dismissed flag and saves to the settings API', () => {
    useOnboardingStore.getState().setDismissed(true)

    expect(useOnboardingStore.getState().dismissed).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      '/api/settings/onboarding.dismissed',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('does nothing when the dismissed flag is unchanged', () => {
    useOnboardingStore.getState().setDismissed(false)

    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('markComplete', () => {
  it('marks a single step complete without affecting others', () => {
    useOnboardingStore.getState().markComplete('voice')

    expect(useOnboardingStore.getState().manuallyCompleted).toEqual({
      voice: true,
      pregen: false,
    })
  })

  it('saves the updated map to the settings API', () => {
    useOnboardingStore.getState().markComplete('pregen')

    expect(fetch).toHaveBeenCalledWith(
      '/api/settings/onboarding.manuallyCompleted',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ value: { voice: false, pregen: true } }),
      }),
    )
  })

  it('does nothing when the step is already marked complete', () => {
    useOnboardingStore.setState({
      manuallyCompleted: { voice: true, pregen: false },
    })

    useOnboardingStore.getState().markComplete('voice')

    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('loadFromApi', () => {
  it('hydrates from a single /api/settings response and marks loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            'onboarding.dismissed': true,
            'onboarding.manuallyCompleted': { voice: true, pregen: false },
          }),
      }),
    )

    await useOnboardingStore.getState().loadFromApi()

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/api/settings')

    const state = useOnboardingStore.getState()

    expect(state.dismissed).toBe(true)
    expect(state.manuallyCompleted).toEqual({ voice: true, pregen: false })
    expect(state.loaded).toBe(true)
  })

  it('falls back to defaults when the settings response is missing the onboarding keys', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }))

    await useOnboardingStore.getState().loadFromApi()

    const state = useOnboardingStore.getState()

    expect(state.dismissed).toBe(false)
    expect(state.manuallyCompleted).toEqual({ voice: false, pregen: false })
    expect(state.loaded).toBe(true)
  })

  it('marks loaded even when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    await useOnboardingStore.getState().loadFromApi()

    expect(useOnboardingStore.getState().loaded).toBe(true)
  })

  it('is idempotent once loaded', async () => {
    useOnboardingStore.setState({ loaded: true })

    await useOnboardingStore.getState().loadFromApi()

    expect(fetch).not.toHaveBeenCalled()
  })
})

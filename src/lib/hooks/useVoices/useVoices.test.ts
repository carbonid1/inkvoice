import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVoices } from './useVoices'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useVoices', () => {
  it('fetches /api/voices with cache: no-store so refetch never hits a stale browser cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useVoices())

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledWith('/api/voices', { cache: 'no-store' })
  })
})

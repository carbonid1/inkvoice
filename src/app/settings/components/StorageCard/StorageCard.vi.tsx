import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockStatsResponse = {
  usedBytes: 2 * 1024 * 1024 * 1024,
  maxBytes: 10 * 1024 * 1024 * 1024,
  diskTotalBytes: 500 * 1024 * 1024 * 1024,
  diskAvailableBytes: 200 * 1024 * 1024 * 1024,
  books: [
    {
      bookId: 'book-1',
      title: 'Jekyll & Hyde',
      usedBytes: 1.5 * 1024 * 1024 * 1024,
      entryCount: 400,
    },
    {
      bookId: 'book-2',
      title: 'Pride and Prejudice',
      usedBytes: 0.5 * 1024 * 1024 * 1024,
      entryCount: 200,
    },
  ],
}

const mockSettingsResponse = {
  maxCacheSizeMB: 10240,
  cacheAutoCleanup: false,
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (typeof url === 'string' && url.includes('/api/cache/stats')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStatsResponse) })
      }
      if (typeof url === 'string' && url.includes('/api/settings')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSettingsResponse) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// Must import after fetch mock is set up
const { StorageCard } = await import('./StorageCard')

describe('StorageCard', () => {
  it('displays cache usage and per-book breakdown', async () => {
    render(<StorageCard />)

    await waitFor(() => {
      expect(screen.getByText('Jekyll & Hyde')).toBeInTheDocument()
    })

    expect(screen.getByText('Pride and Prejudice')).toBeInTheDocument()
    expect(screen.getByText(/2\.0 GB of 10\.0 GB used/)).toBeInTheDocument()
  })

  it('shows empty state when no books have cache', async () => {
    vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/api/cache/stats')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockStatsResponse,
              usedBytes: 0,
              books: [],
            }),
        } as Response)
      }
      if (urlStr.includes('/api/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSettingsResponse),
        } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    })

    render(<StorageCard />)

    await waitFor(() => {
      expect(screen.getByText('No cached audio.')).toBeInTheDocument()
    })
  })

  it('calls delete API when trash button is clicked', async () => {
    const user = userEvent.setup()
    render(<StorageCard />)

    await waitFor(() => {
      expect(screen.getByText('Jekyll & Hyde')).toBeInTheDocument()
    })

    const deleteButton = screen.getByLabelText('Delete cache for Jekyll & Hyde')
    await user.click(deleteButton)

    expect(fetch).toHaveBeenCalledWith('/api/cache/tts/book-1', { method: 'DELETE' })
  })
})

import { expect, waitFor } from 'storybook/test'
import preview from '#.storybook/preview'
import { StorageCard } from './StorageCard'

const GB = 1024 * 1024 * 1024

const baseStats = {
  usedBytes: 2 * GB,
  maxBytes: 10 * GB,
  diskTotalBytes: 500 * GB,
  diskAvailableBytes: 200 * GB,
  books: [
    { bookId: 'book-1', title: 'Jekyll & Hyde', usedBytes: 1.5 * GB, entryCount: 400 },
    { bookId: 'book-2', title: 'Pride and Prejudice', usedBytes: 0.5 * GB, entryCount: 200 },
  ],
}

const baseSettings = {
  maxCacheSizeMB: 10240,
  cacheAutoCleanup: false,
}

const fetchCalls: { deletes: string[] } = { deletes: [] }

const stubFetch = (stats: typeof baseStats) => {
  const original = globalThis.fetch

  fetchCalls.deletes = []

  const stub: typeof fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.toString()

    if (url.includes('/api/cache/stats')) return Promise.resolve(Response.json(stats))
    if (url.includes('/api/settings')) return Promise.resolve(Response.json(baseSettings))
    if (init?.method === 'DELETE' && url.includes('/api/cache/tts/')) {
      fetchCalls.deletes.push(url)
      return Promise.resolve(Response.json({ freedBytes: 1024 }))
    }
    return Promise.resolve(Response.json({}))
  }

  globalThis.fetch = stub

  return () => {
    globalThis.fetch = original
  }
}

const meta = preview.meta({
  component: StorageCard,
  decorators: [
    Story => (
      <div className="w-[520px]">
        <Story />
      </div>
    ),
  ],
})

/** Cache populated with two books — the typical state of the Storage settings card. */
export const Loaded = meta.story({
  beforeEach: () => stubFetch(baseStats),
})

Loaded.test('lists each cached book and the total cache usage', async ({ canvas }) => {
  await waitFor(() => {
    expect(canvas.getByText('Jekyll & Hyde')).toBeInTheDocument()
  })
  expect(canvas.getByText('Pride and Prejudice')).toBeInTheDocument()
  expect(canvas.getByText(/2\.0 GB of 10\.0 GB used/)).toBeInTheDocument()
})

Loaded.test(
  'clicking the per-book trash icon calls the delete API',
  async ({ canvas, userEvent }) => {
    await waitFor(() => {
      expect(canvas.getByText('Jekyll & Hyde')).toBeInTheDocument()
    })

    await userEvent.click(canvas.getByLabelText('Delete cache for Jekyll & Hyde'))

    await waitFor(() => {
      expect(fetchCalls.deletes).toContain('/api/cache/tts/book-1')
    })
  },
)

/** No cached audio yet — the per-book list collapses to an empty-state line. */
export const Empty = meta.story({
  beforeEach: () => stubFetch({ ...baseStats, usedBytes: 0, books: [] }),
})

Empty.test('shows the no-cache empty state', async ({ canvas }) => {
  await waitFor(() => {
    expect(canvas.getByText('No cached audio.')).toBeInTheDocument()
  })
})

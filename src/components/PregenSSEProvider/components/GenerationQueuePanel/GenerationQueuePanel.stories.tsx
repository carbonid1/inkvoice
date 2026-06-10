import { expect } from 'storybook/test'
import preview from '#.storybook/preview'
import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import type { Book } from '@/lib/types/book'
import { useLibraryStore } from '@/store/useLibraryStore'
import { usePregenStore } from '@/store/usePregenStore'
import { GenerationQueuePanel } from './GenerationQueuePanel'

const buildJob = (overrides: Partial<PregenJob>): PregenJob => ({
  id: 'job',
  bookId: 'book',
  voice: 'narrator',
  status: 'queued',
  totalParagraphs: 0,
  completedParagraphs: 0,
  generatedDurationMs: 0,
  currentChapter: 0,
  currentParagraph: 0,
  errorMessage: null,
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
})

const ODYSSEY_JOB = buildJob({
  id: 'job-odyssey',
  bookId: 'the-odyssey',
  status: 'paused',
  totalParagraphs: 1259,
  completedParagraphs: 12,
  currentParagraph: 12,
})

const JEKYLL_JOB = buildJob({
  id: 'job-jekyll',
  bookId: 'the-strange-case-of-dr-jekyll-and-mr-hyde',
  status: 'in_progress',
  totalParagraphs: 364,
  completedParagraphs: 130,
  generatedDurationMs: 754_000,
  currentChapter: 4,
  currentParagraph: 130,
})

const BOOKS: Book[] = [
  { id: 'the-odyssey', title: 'The Odyssey', author: 'Homer', filename: 'the-odyssey.epub' },
  {
    id: 'the-strange-case-of-dr-jekyll-and-mr-hyde',
    title: 'The Strange Case of Dr. Jekyll and Mr. Hyde',
    author: 'Robert Louis Stevenson',
    filename: 'the-strange-case-of-dr-jekyll-and-mr-hyde.epub',
  },
]

const meta = preview.meta({
  component: GenerationQueuePanel,
  beforeEach: () => {
    useLibraryStore.setState({ books: BOOKS })
    usePregenStore.setState({
      panelOpen: true,
      jobs: { [ODYSSEY_JOB.bookId]: ODYSSEY_JOB, [JEKYLL_JOB.bookId]: JEKYLL_JOB },
      samplingRates: { [JEKYLL_JOB.bookId]: 5.2 },
      warmingUpBookId: null,
    })
  },
})

/** Queue popover with a paused job and an actively generating job. */
export const WithJobs = meta.story({})

WithJobs.test('exposes each generation job as a named list item', ({ canvas }) => {
  expect(canvas.getAllByRole('listitem')).toHaveLength(2)
  canvas.getByRole('listitem', { name: 'The Odyssey: Paused, 12 of 1259 paragraphs' })
  canvas.getByRole('listitem', {
    name: 'The Strange Case of Dr. Jekyll and Mr. Hyde: Generating, 130 of 364 paragraphs',
  })
})

WithJobs.test('names the panel region and its close button for assistive tech', ({ canvas }) => {
  canvas.getByRole('region', { name: 'Generation Queue' })
  canvas.getByRole('button', { name: 'Close generation queue' })
})

/** Queue popover with no generation jobs queued. */
export const Empty = meta.story({
  beforeEach: () => {
    usePregenStore.setState({ jobs: {}, samplingRates: {} })
  },
})

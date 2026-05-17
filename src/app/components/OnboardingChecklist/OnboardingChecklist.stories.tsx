import { expect } from 'storybook/test'
import preview from '#.storybook/preview'
import type { Book } from '@/lib/types/book'
import { useLibraryStore } from '@/store/useLibraryStore'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { usePregenStore } from '@/store/usePregenStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useVoiceStore } from '@/store/useVoiceStore'
import { OnboardingChecklist } from './OnboardingChecklist'

const SAMPLE_BOOK: Book = {
  id: 'book-1',
  title: 'Treasure Island',
  author: 'Robert Louis Stevenson',
  filename: 'treasure-island.epub',
}

const resetStores = () => {
  useOnboardingStore.setState({
    dismissed: false,
    manuallyCompleted: { voice: false, pregen: false },
    loaded: true,
  })
  useVoiceStore.setState({ voice: 'clara', bookVoices: {}, loaded: true })
  useLibraryStore.setState({ books: [], currentBook: null })
  useProgressStore.setState({ progress: {}, loaded: true })
  usePregenStore.setState({ jobs: {}, estimates: {}, warmingUpBookId: null, loaded: true })
}

const meta = preview.meta({
  component: OnboardingChecklist,
  decorators: [
    Story => (
      <div className="w-[760px]">
        <Story />
      </div>
    ),
  ],
})

/** Cold start — no books, default voice, no jobs. Both steps pending. */
export const ZeroComplete = meta.story({
  beforeEach: () => {
    resetStores()
  },
})

ZeroComplete.test('shows the panel with a 0 of 2 badge', ({ canvas }) => {
  expect(canvas.getByText('Get started')).toBeInTheDocument()
  expect(canvas.getByText('0 of 2')).toBeInTheDocument()
})

ZeroComplete.test('both steps are incomplete', ({ canvas }) => {
  expect(canvas.getAllByText('incomplete')).toHaveLength(2)
})

ZeroComplete.test('pregen step has no action when no books exist', ({ canvas }) => {
  expect(canvas.queryByRole('link', { name: /Open a book/ })).not.toBeInTheDocument()
})

/** A non-default voice picked with a book in the library — the voice step ticks; pre-gen stays pending with an action. */
export const OneComplete = meta.story({
  beforeEach: () => {
    resetStores()
    useLibraryStore.setState({ books: [SAMPLE_BOOK], currentBook: null })
    useVoiceStore.setState({ voice: 'jonathan', bookVoices: {}, loaded: true })
  },
})

OneComplete.test('shows 1 of 2', ({ canvas }) => {
  expect(canvas.getByText('1 of 2')).toBeInTheDocument()
})

OneComplete.test('pregen step links to the only book', ({ canvas }) => {
  expect(canvas.getByRole('link', { name: /Open a book/ })).toHaveAttribute(
    'href',
    '/book/book-1?onboarding=pregen',
  )
})

/** Both steps satisfied — panel removes itself from the tree (renders nothing). */
export const AllComplete = meta.story({
  beforeEach: () => {
    resetStores()
    useLibraryStore.setState({ books: [SAMPLE_BOOK], currentBook: null })
    useVoiceStore.setState({ voice: 'jonathan', bookVoices: {}, loaded: true })
    useOnboardingStore.setState({
      dismissed: false,
      manuallyCompleted: { voice: false, pregen: true },
      loaded: true,
    })
  },
})

AllComplete.test('renders nothing when both steps are done', ({ canvas }) => {
  expect(canvas.queryByText('Get started')).not.toBeInTheDocument()
})

/** Dismissed — panel is suppressed regardless of step progress. */
export const Dismissed = meta.story({
  beforeEach: () => {
    resetStores()
    useOnboardingStore.setState({
      dismissed: true,
      manuallyCompleted: { voice: false, pregen: false },
      loaded: true,
    })
  },
})

Dismissed.test('renders nothing when the user dismissed the panel', ({ canvas }) => {
  expect(canvas.queryByText('Get started')).not.toBeInTheDocument()
})

import { expect } from 'storybook/test'
import preview from '#.storybook/preview'
import { CreditsCard } from './CreditsCard'

const meta = preview.meta({
  component: CreditsCard,
})

/** Settings card crediting the bundled-voice and TTS datasets — required by the dataset licenses. */
export const Default = meta.story({})

Default.test('shows the Voice Credits heading', ({ canvas }) => {
  expect(canvas.getByRole('heading', { name: 'Voice Credits' })).toBeInTheDocument()
})

Default.test('links to the HiFi-TTS dataset', ({ canvas }) => {
  expect(canvas.getByRole('link', { name: /openslr\.org/i })).toHaveAttribute(
    'href',
    'http://openslr.org/109/',
  )
})

Default.test('links to CC BY 4.0 license', ({ canvas }) => {
  expect(canvas.getByRole('link', { name: /CC BY 4\.0/i })).toHaveAttribute(
    'href',
    'https://creativecommons.org/licenses/by/4.0/',
  )
})

Default.test('mentions modifications made to the audio', ({ canvas }) => {
  expect(canvas.getByText(/trimmed and processed/i)).toBeInTheDocument()
})

Default.test('links to the LJ Speech Dataset', ({ canvas }) => {
  expect(canvas.getByRole('link', { name: /LJ Speech Dataset/i })).toHaveAttribute(
    'href',
    'https://keithito.com/LJ-Speech-Dataset/',
  )
})

Default.test('opens every link in a new tab securely', ({ canvas }) => {
  for (const link of canvas.getAllByRole('link')) {
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel') ?? '').toContain('noopener')
  }
})

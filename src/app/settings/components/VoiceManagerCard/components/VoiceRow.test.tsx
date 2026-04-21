'use client'

import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { PlayingState } from '../hooks/useVoicePreview/useVoicePreview.types'
import { VoiceRow } from './VoiceRow'

const makeVoice = (overrides: Partial<VoiceEntry> = {}): VoiceEntry => ({
  name: 'clara',
  displayName: 'Clara',
  type: 'app',
  hasSample: true,
  tags: ['female', 'british'],
  ...overrides,
})

const playing: PlayingState = null
const defaultProps = {
  voice: makeVoice(),
  selected: false,
  editingTags: false,
  onSelect: vi.fn(),
  onToggleTagEditor: vi.fn(),
  playing,
  onPlay: vi.fn(),
  onTagsChanged: vi.fn(),
  tagsSaving: false,
}

const renderRow = (overrides = {}) =>
  render(
    <StrictMode>
      <VoiceRow {...defaultProps} {...overrides} />
    </StrictMode>,
  )

describe('VoiceRow', () => {
  it('clicking voice name calls onSelect', () => {
    const onSelect = vi.fn()
    renderRow({ onSelect })

    fireEvent.click(screen.getByRole('button', { name: /^Clara/ }))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('selected row has aria-current', () => {
    renderRow({ selected: true })

    const row = screen.getByRole('button', { name: /^Clara/ })
    expect(row).toHaveAttribute('aria-current', 'true')
  })

  it('unselected row does not have aria-current', () => {
    renderRow({ selected: false })

    const row = screen.getByRole('button', { name: /^Clara/ })
    expect(row).not.toHaveAttribute('aria-current', 'true')
  })

  it('source button has aria-label with voice name', () => {
    renderRow()

    expect(screen.getByRole('button', { name: /Play source audio for Clara/ })).toBeInTheDocument()
  })

  it('sample button has aria-label with voice name', () => {
    renderRow()

    expect(screen.getByRole('button', { name: /Play voice sample for Clara/ })).toBeInTheDocument()
  })

  it('sample button hidden when hasSample is false for app voices', () => {
    renderRow({ voice: makeVoice({ hasSample: false, type: 'app' }) })

    expect(
      screen.queryByRole('button', { name: /Play voice sample|Generating sample/ }),
    ).not.toBeInTheDocument()
  })

  it('shows disabled generating button for custom voice without sample', () => {
    renderRow({
      voice: makeVoice({
        hasSample: false,
        type: 'custom',
        name: 'my-voice',
        displayName: 'My Voice',
      }),
    })

    const button = screen.getByRole('button', { name: /Generating sample for My Voice/ })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('animate-pulse')
  })

  it('shows interactive sample button for custom voice with sample', () => {
    renderRow({
      voice: makeVoice({
        hasSample: true,
        type: 'custom',
        name: 'my-voice',
        displayName: 'My Voice',
      }),
    })

    const button = screen.getByRole('button', { name: /Play voice sample for My Voice/ })
    expect(button).not.toBeDisabled()
    expect(button).not.toHaveClass('animate-pulse')
  })

  it('source button shows "Stop" label when playing source', () => {
    const playing: PlayingState = { name: 'clara', type: 'source' }
    renderRow({ playing })

    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Play source audio/ })).not.toBeInTheDocument()
  })

  it('hides edit tags button for app voices', () => {
    renderRow({ voice: makeVoice({ type: 'app' }) })

    expect(screen.queryByRole('button', { name: /Edit tags/ })).not.toBeInTheDocument()
  })

  it('edit tags button calls onToggleTagEditor for custom voices', () => {
    const onToggleTagEditor = vi.fn()
    renderRow({ voice: makeVoice({ type: 'custom' }), onToggleTagEditor })

    fireEvent.click(screen.getByRole('button', { name: /Edit tags for Clara/ }))
    expect(onToggleTagEditor).toHaveBeenCalledOnce()
  })

  it('tags are always visible inline', () => {
    renderRow()

    expect(screen.getByText('female')).toBeInTheDocument()
    expect(screen.getByText('british')).toBeInTheDocument()
  })

  it('delete button shown only when onDelete is provided', () => {
    renderRow({ onDelete: undefined })
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument()

    const onDelete = vi.fn()
    renderRow({ onDelete })
    expect(screen.getByRole('button', { name: /Remove/ })).toBeInTheDocument()
  })

  it('clicking source play calls onPlay with source', () => {
    const onPlay = vi.fn()
    renderRow({ onPlay })

    fireEvent.click(screen.getByRole('button', { name: /Play source audio for Clara/ }))
    expect(onPlay).toHaveBeenCalledWith('clara', 'source')
  })

  it('clicking sample play calls onPlay with sample', () => {
    const onPlay = vi.fn()
    renderRow({ onPlay })

    fireEvent.click(screen.getByRole('button', { name: /Play voice sample for Clara/ }))
    expect(onPlay).toHaveBeenCalledWith('clara', 'sample')
  })

  it('clicking delete calls onDelete immediately', () => {
    const onDelete = vi.fn()
    renderRow({ onDelete })

    fireEvent.click(screen.getByRole('button', { name: /Remove/ }))
    expect(onDelete).toHaveBeenCalledWith('clara')
  })
})

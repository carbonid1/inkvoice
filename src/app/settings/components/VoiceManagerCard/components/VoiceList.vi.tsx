'use client'

import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { VoiceList } from './VoiceList'

vi.mock('@/lib/hooks/useUpdateVoiceTags/useUpdateVoiceTags', () => ({
  useUpdateVoiceTags: () => ({ saving: false, updateTags: vi.fn() }),
}))

const appVoice: VoiceEntry = {
  name: 'clara',
  displayName: 'Clara',
  type: 'app',
  hasSample: true,
  tags: ['female', 'british'],
}

const customVoice: VoiceEntry = {
  name: 'my-voice',
  displayName: 'My Voice',
  type: 'custom',
  hasSample: false,
  tags: ['male'],
}

const defaultProps = {
  voices: [appVoice, customVoice],
  selectedVoice: 'clara',
  onSelect: vi.fn(),
  playing: null,
  onPlay: vi.fn(),
  onDelete: vi.fn(),
  deleting: false,
}

const renderList = (overrides = {}) =>
  render(
    <StrictMode>
      <VoiceList {...defaultProps} {...overrides} />
    </StrictMode>,
  )

describe('VoiceList', () => {
  it('renders "Your Voices" section before "Included Voices"', () => {
    renderList()

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings[0]).toHaveTextContent('Your Voices')
    expect(headings[1]).toHaveTextContent('Included Voices')
  })

  it('hides "Your Voices" heading when no custom voices', () => {
    renderList({ voices: [appVoice] })

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Included Voices')
  })

  it('selected voice row has aria-current', () => {
    renderList({ selectedVoice: 'clara' })

    const claraButton = screen.getByRole('button', { name: /Clara/ })
    expect(claraButton).toHaveAttribute('aria-current', 'true')
  })

  it('non-selected voice row does not have aria-current', () => {
    renderList({ selectedVoice: 'clara' })

    const myVoiceButton = screen.getByRole('button', { name: /^My Voice/ })
    expect(myVoiceButton).not.toHaveAttribute('aria-current', 'true')
  })
})

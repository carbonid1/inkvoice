import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { VoiceSelect } from './VoiceSelect'

const voices: VoiceEntry[] = [
  { name: 'narrator', displayName: 'Narrator', type: 'app', hasSample: false, tags: [] },
  {
    name: 'casual',
    displayName: 'Casual',
    type: 'app',
    hasSample: true,
    tags: ['warm', 'friendly'],
  },
  {
    name: 'dan',
    displayName: 'REDACTED',
    type: 'custom',
    hasSample: false,
    tags: ['male', 'british'],
  },
]

const renderWith = (ui: React.ReactElement) => render(<StrictMode>{ui}</StrictMode>)

describe('VoiceSelect', () => {
  it('renders selected voice name in button', () => {
    renderWith(<VoiceSelect voices={voices} value="casual" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /casual/i })).toBeInTheDocument()
  })

  it('opens menu on button click showing all voices', () => {
    renderWith(<VoiceSelect voices={voices} value="narrator" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /narrator/i }))

    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeInTheDocument()

    expect(screen.getByRole('option', { name: /narrator/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /casual/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /dan boud/i })).toBeInTheDocument()
  })

  it('calls onChange and closes menu when a voice is selected', () => {
    const onChange = vi.fn()
    renderWith(<VoiceSelect voices={voices} value="narrator" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /narrator/i }))
    fireEvent.click(screen.getByRole('option', { name: /dan boud/i }))

    expect(onChange).toHaveBeenCalledWith('dan')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows tags below voice name in menu items', () => {
    renderWith(<VoiceSelect voices={voices} value="narrator" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /narrator/i }))

    const casualOption = screen.getByRole('option', { name: /casual/i })
    expect(casualOption).toHaveTextContent('warm, friendly')

    const danOption = screen.getByRole('option', { name: /dan boud/i })
    expect(danOption).toHaveTextContent('male, british')

    // Narrator has no tags — should not render tag text
    const narratorOption = screen.getByRole('option', { name: /^narrator$/i })
    expect(narratorOption).not.toHaveTextContent(',')
  })

  it('closes on Escape key', () => {
    renderWith(<VoiceSelect voices={voices} value="narrator" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /narrator/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole('button', { name: /narrator/i }), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on click outside', () => {
    renderWith(<VoiceSelect voices={voices} value="narrator" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /narrator/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('navigates with arrow keys and selects with Enter', () => {
    const onChange = vi.fn()
    renderWith(<VoiceSelect voices={voices} value="narrator" onChange={onChange} />)

    const button = screen.getByRole('button', { name: /narrator/i })
    fireEvent.click(button)

    // Arrow down highlights first item, then second
    fireEvent.keyDown(button, { key: 'ArrowDown' })
    fireEvent.keyDown(button, { key: 'ArrowDown' })

    // Enter selects the highlighted item
    fireEvent.keyDown(button, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('casual')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('groups voices by app/custom with group labels', () => {
    renderWith(<VoiceSelect voices={voices} value="narrator" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /narrator/i }))

    expect(screen.getByText('App Voices')).toBeInTheDocument()
    expect(screen.getByText('Custom Voices')).toBeInTheDocument()
  })

  it('shows placeholder when value does not match any voice', () => {
    renderWith(
      <VoiceSelect voices={voices} value="unknown" onChange={vi.fn()} placeholder="Pick a voice" />,
    )

    expect(screen.getByRole('button', { name: /pick a voice/i })).toBeInTheDocument()
  })

  it('renders extra options before voice groups', () => {
    const onChange = vi.fn()
    renderWith(
      <VoiceSelect
        voices={voices}
        value="__default__"
        onChange={onChange}
        extraOptions={[{ value: '__default__', label: 'Default (Narrator)' }]}
      />,
    )

    expect(screen.getByRole('button', { name: /default \(narrator\)/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /default \(narrator\)/i }))

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Default (Narrator)')
  })
})

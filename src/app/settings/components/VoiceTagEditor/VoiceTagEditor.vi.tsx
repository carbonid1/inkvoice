import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { VoiceTagEditor } from './VoiceTagEditor'

const renderWith = (ui: React.ReactElement) => render(<StrictMode>{ui}</StrictMode>)

describe('VoiceTagEditor', () => {
  it('renders existing tags as removable badges', () => {
    renderWith(<VoiceTagEditor tags={['male', 'british']} onTagsChanged={vi.fn()} saving={false} />)

    expect(screen.getByRole('button', { name: /remove male/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove british/i })).toBeInTheDocument()
  })

  it('calls onTagsChanged without the tag when remove is clicked', () => {
    const onTagsChanged = vi.fn()
    renderWith(
      <VoiceTagEditor
        tags={['male', 'british', 'warm']}
        onTagsChanged={onTagsChanged}
        saving={false}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /remove british/i }))
    expect(onTagsChanged).toHaveBeenCalledWith(['male', 'warm'])
  })

  it('adds a custom tag via text input on Enter', () => {
    const onTagsChanged = vi.fn()
    renderWith(<VoiceTagEditor tags={['male']} onTagsChanged={onTagsChanged} saving={false} />)

    const input = screen.getByPlaceholderText('Add tag...')
    fireEvent.change(input, { target: { value: 'deep' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onTagsChanged).toHaveBeenCalledWith(['male', 'deep'])
  })

  it('clears the input after adding a custom tag', () => {
    renderWith(<VoiceTagEditor tags={[]} onTagsChanged={vi.fn()} saving={false} />)

    const input = screen.getByPlaceholderText('Add tag...')
    fireEvent.change(input, { target: { value: 'deep' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(input).toHaveValue('')
  })

  it('does not add a blank custom tag', () => {
    const onTagsChanged = vi.fn()
    renderWith(<VoiceTagEditor tags={[]} onTagsChanged={onTagsChanged} saving={false} />)

    const input = screen.getByPlaceholderText('Add tag...')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onTagsChanged).not.toHaveBeenCalled()
  })
})

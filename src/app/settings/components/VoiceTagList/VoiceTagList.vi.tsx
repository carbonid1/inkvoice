import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import { VoiceTagList } from './VoiceTagList'

const renderWith = (ui: React.ReactElement) => render(<StrictMode>{ui}</StrictMode>)

describe('VoiceTagList', () => {
  it('renders each tag as a badge', () => {
    renderWith(<VoiceTagList tags={['british', 'male', 'warm']} />)
    expect(screen.getByText('british')).toBeInTheDocument()
    expect(screen.getByText('male')).toBeInTheDocument()
    expect(screen.getByText('warm')).toBeInTheDocument()
  })

  it('renders nothing when tags are empty', () => {
    const { container } = renderWith(<VoiceTagList tags={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

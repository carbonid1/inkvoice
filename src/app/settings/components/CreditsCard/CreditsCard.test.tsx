import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it } from 'vitest'
import { CreditsCard } from './CreditsCard'

const renderCard = () =>
  render(
    <StrictMode>
      <CreditsCard />
    </StrictMode>,
  )

describe('CreditsCard', () => {
  it('renders the Voice Credits heading', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Voice Credits' })).toBeInTheDocument()
  })

  it('contains HiFi-TTS attribution with dataset link', () => {
    renderCard()
    const link = screen.getByRole('link', { name: /openslr\.org/i })
    expect(link).toHaveAttribute('href', 'http://openslr.org/109/')
  })

  it('contains CC BY 4.0 license link', () => {
    renderCard()
    const link = screen.getByRole('link', { name: /CC BY 4\.0/i })
    expect(link).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/')
  })

  it('mentions modifications made to the audio', () => {
    renderCard()
    expect(screen.getByText(/trimmed and processed/i)).toBeInTheDocument()
  })

  it('contains LJSpeech attribution with link', () => {
    renderCard()
    const link = screen.getByRole('link', { name: /LJ Speech Dataset/i })
    expect(link).toHaveAttribute('href', 'https://keithito.com/LJ-Speech-Dataset/')
  })

  it('opens all links in new tabs securely', () => {
    renderCard()
    const links = screen.getAllByRole('link')
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    }
  })
})

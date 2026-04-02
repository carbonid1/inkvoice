import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BufferRing } from './BufferRing'
import { CIRCUMFERENCE } from './BufferRing.consts'

describe('BufferRing', () => {
  it('renders SVG with correct dashoffset for 50% progress', () => {
    render(<BufferRing ahead={60} isGenerating={false} />)
    const circle = screen.getByTestId('buffer-ring-fill')
    const offset = Number(circle.getAttribute('stroke-dashoffset'))
    const expected = CIRCUMFERENCE * (1 - 60 / 120)
    expect(offset).toBeCloseTo(expected, 1)
  })

  it('renders full ring at max ahead', () => {
    render(<BufferRing ahead={120} isGenerating={false} />)
    const circle = screen.getByTestId('buffer-ring-fill')
    const offset = Number(circle.getAttribute('stroke-dashoffset'))
    expect(offset).toBeCloseTo(0, 1)
  })

  it('applies pulse animation class when generating', () => {
    render(<BufferRing ahead={10} isGenerating={true} />)
    const svg = screen.getByRole('img', { hidden: true })
    expect(svg.classList.toString()).toContain('animate-buffer-pulse')
  })

  it('does not apply pulse animation class when idle', () => {
    render(<BufferRing ahead={10} isGenerating={false} />)
    const svg = screen.getByRole('img', { hidden: true })
    expect(svg.classList.toString()).not.toContain('animate-buffer-pulse')
  })

  it('sets aria-label with buffer label', () => {
    render(<BufferRing ahead={42} isGenerating={true} />)
    const svg = screen.getByRole('img', { hidden: true })
    expect(svg.getAttribute('aria-label')).toBe('42 paragraphs ready \u00b7 Generating...')
  })
})

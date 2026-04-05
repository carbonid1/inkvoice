import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressRing } from './ProgressRing'
import { CIRCUMFERENCE } from './ProgressRing.consts'

describe('ProgressRing', () => {
  it('renders zero dashoffset at 0% progress', () => {
    render(<ProgressRing progress={0} colorClass="text-primary" label="Empty" testId="ring" />)
    const circle = screen.getByTestId('ring')
    const offset = Number(circle.getAttribute('stroke-dashoffset'))
    expect(offset).toBeCloseTo(CIRCUMFERENCE, 1)
  })

  it('renders correct dashoffset at 50% progress', () => {
    render(<ProgressRing progress={0.5} colorClass="text-primary" label="Half" testId="ring" />)
    const circle = screen.getByTestId('ring')
    const offset = Number(circle.getAttribute('stroke-dashoffset'))
    expect(offset).toBeCloseTo(CIRCUMFERENCE * 0.5, 1)
  })

  it('renders zero dashoffset at 100% progress', () => {
    render(<ProgressRing progress={1} colorClass="text-success" label="Full" testId="ring" />)
    const circle = screen.getByTestId('ring')
    const offset = Number(circle.getAttribute('stroke-dashoffset'))
    expect(offset).toBeCloseTo(0, 1)
  })

  it('applies colorClass to fill circle', () => {
    render(<ProgressRing progress={0.5} colorClass="text-success" label="Test" testId="ring" />)
    const circle = screen.getByTestId('ring')
    expect(circle.classList.toString()).toContain('text-success')
  })

  it('applies pulse animation when animate is true', () => {
    render(<ProgressRing progress={0.5} colorClass="text-primary" label="Pulsing" animate />)
    const svg = screen.getByRole('img', { hidden: true })
    expect(svg.classList.toString()).toContain('animate-buffer-pulse')
  })

  it('does not apply pulse animation when animate is false', () => {
    render(<ProgressRing progress={0.5} colorClass="text-primary" label="Idle" />)
    const svg = screen.getByRole('img', { hidden: true })
    expect(svg.classList.toString()).not.toContain('animate-buffer-pulse')
  })

  it('sets aria-label from label prop', () => {
    render(<ProgressRing progress={0.5} colorClass="text-primary" label="42 paragraphs ready" />)
    const svg = screen.getByRole('img', { hidden: true })
    expect(svg.getAttribute('aria-label')).toBe('42 paragraphs ready')
  })
})

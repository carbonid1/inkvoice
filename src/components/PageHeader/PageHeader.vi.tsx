import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders children inside a header element', () => {
    render(
      <PageHeader>
        <h1>Test Title</h1>
      </PageHeader>,
    )

    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('applies base visual classes', () => {
    render(
      <PageHeader>
        <span>Content</span>
      </PageHeader>,
    )

    const header = screen.getByRole('banner')
    expect(header.className).toContain('bg-background')
    expect(header.className).toContain('border-b')
    expect(header.className).toContain('flex-shrink-0')
  })

  it('appends custom className to base classes', () => {
    render(
      <PageHeader className="mt-4">
        <span>Content</span>
      </PageHeader>,
    )

    const header = screen.getByRole('banner')
    expect(header.className).toContain('bg-background')
    expect(header.className).toContain('mt-4')
  })
})

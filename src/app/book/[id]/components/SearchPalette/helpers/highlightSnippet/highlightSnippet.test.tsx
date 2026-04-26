import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { highlightSnippet } from './highlightSnippet'

describe('highlightSnippet', () => {
  it('returns plain text when matchPositions is empty', () => {
    render(<span>{highlightSnippet('hello world', 'xyz', [])}</span>)
    expect(screen.getByText('hello world')).toBeTruthy()
    expect(screen.queryByRole('mark')).toBeNull()
  })

  it('wraps single match in mark element', () => {
    // "hello world", query "world" at position 6
    const { container } = render(<span>{highlightSnippet('hello world', 'world', [6])}</span>)
    const marks = container.querySelectorAll('mark')

    expect(marks).toHaveLength(1)
    expect(marks[0]!.textContent).toBe('world')
  })

  it('handles multiple non-overlapping matches', () => {
    // "the cat and the dog", query "the" at positions 0 and 12
    const { container } = render(
      <span>{highlightSnippet('the cat and the dog', 'the', [0, 12])}</span>,
    )
    const marks = container.querySelectorAll('mark')

    expect(marks).toHaveLength(2)
    expect(marks[0]!.textContent).toBe('the')
    expect(marks[1]!.textContent).toBe('the')
  })

  it('handles match at start of string', () => {
    const { container } = render(<span>{highlightSnippet('hello world', 'hello', [0])}</span>)
    const marks = container.querySelectorAll('mark')

    expect(marks).toHaveLength(1)
    expect(marks[0]!.textContent).toBe('hello')
  })

  it('handles match at end of string', () => {
    const { container } = render(<span>{highlightSnippet('say hello', 'hello', [4])}</span>)
    const marks = container.querySelectorAll('mark')

    expect(marks).toHaveLength(1)
    expect(marks[0]!.textContent).toBe('hello')
  })

  it('applies highlight classes to mark elements', () => {
    const { container } = render(<span>{highlightSnippet('test text', 'test', [0])}</span>)
    const mark = container.querySelector('mark')

    expect(mark!.className).toContain('bg-attention-muted')
  })
})

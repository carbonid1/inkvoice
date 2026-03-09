'use client'

import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Tooltip } from './Tooltip'

const renderWithStrictMode = (ui: React.ReactElement) => render(<StrictMode>{ui}</StrictMode>)

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is hidden by default', () => {
    renderWithStrictMode(
      <Tooltip label="Test">
        <button>Click me</button>
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows on hover after delay and hides on leave', () => {
    renderWithStrictMode(
      <Tooltip label="Test label">
        <button>Click me</button>
      </Tooltip>,
    )

    const wrapper = screen.getByRole('button').parentElement!
    fireEvent.mouseEnter(wrapper)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Test label')

    fireEvent.mouseLeave(wrapper)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows on focus and hides on blur', () => {
    renderWithStrictMode(
      <Tooltip label="Focus test">
        <button>Click me</button>
      </Tooltip>,
    )

    const button = screen.getByRole('button')
    fireEvent.focus(button)
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Focus test')

    fireEvent.blur(button)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders shortcut badge when shortcut provided', () => {
    renderWithStrictMode(
      <Tooltip label="Play" shortcut="Space">
        <button>Click me</button>
      </Tooltip>,
    )

    const wrapper = screen.getByRole('button').parentElement!
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(200))

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('Play')
    expect(tooltip.querySelector('kbd')).toHaveTextContent('Space')
  })

  it('does not render shortcut badge when shortcut omitted', () => {
    renderWithStrictMode(
      <Tooltip label="Close">
        <button>Click me</button>
      </Tooltip>,
    )

    const wrapper = screen.getByRole('button').parentElement!
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(200))

    expect(screen.getByRole('tooltip').querySelector('kbd')).toBeNull()
  })

  it('sets aria-label on trigger from label prop', () => {
    renderWithStrictMode(
      <Tooltip label="Previous Sentence">
        <button>
          <span>icon</span>
        </button>
      </Tooltip>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Previous Sentence')
  })

  it('preserves existing aria-label on trigger', () => {
    renderWithStrictMode(
      <Tooltip label="Previous Sentence">
        <button aria-label="Custom label">
          <span>icon</span>
        </button>
      </Tooltip>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Custom label')
  })

  it('applies max-width and wraps text when maxWidth is set', () => {
    renderWithStrictMode(
      <Tooltip label="Long tooltip text" maxWidth={200}>
        <button>Click me</button>
      </Tooltip>,
    )

    const wrapper = screen.getByRole('button').parentElement!
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(200))

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveStyle({ maxWidth: '200px' })
    expect(tooltip.className).toContain('whitespace-normal')
    expect(tooltip.className).not.toContain('whitespace-nowrap')
  })

  it('hides on pointerdown', () => {
    renderWithStrictMode(
      <Tooltip label="Test">
        <button>Click me</button>
      </Tooltip>,
    )

    const wrapper = screen.getByRole('button').parentElement!
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.pointerDown(wrapper)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('hides when pointer moves outside while visible', () => {
    renderWithStrictMode(
      <Tooltip label="Test">
        <button>Click me</button>
      </Tooltip>,
    )

    const wrapper = screen.getByRole('button').parentElement!
    vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 200,
      top: 100,
      bottom: 150,
      width: 100,
      height: 50,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    })

    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 300,
          clientY: 300,
          bubbles: true,
        }),
      )
    })

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('hides on pointerdown when shown via focus', () => {
    renderWithStrictMode(
      <Tooltip label="Focus test">
        <button>Click me</button>
      </Tooltip>,
    )

    const button = screen.getByRole('button')
    fireEvent.focus(button)
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.pointerDown(button.parentElement!)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('cancels pending show on pointerdown before delay', () => {
    renderWithStrictMode(
      <Tooltip label="Test">
        <button>Click me</button>
      </Tooltip>,
    )

    const wrapper = screen.getByRole('button').parentElement!
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(100))
    fireEvent.pointerDown(wrapper)
    act(() => vi.advanceTimersByTime(200))

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('does not show when disabled is true', () => {
    renderWithStrictMode(
      <Tooltip label="Test" disabled>
        <button>Click me</button>
      </Tooltip>,
    )

    const wrapper = screen.getByRole('button').parentElement!
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(200))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.focus(screen.getByRole('button'))
    act(() => vi.advanceTimersByTime(200))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('hides tooltip when disabled becomes true while visible', () => {
    const { rerender } = renderWithStrictMode(
      <Tooltip label="Test">
        <button>Click me</button>
      </Tooltip>,
    )

    const wrapper = screen.getByRole('button').parentElement!
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    rerender(
      <StrictMode>
        <Tooltip label="Test" disabled>
          <button>Click me</button>
        </Tooltip>
      </StrictMode>,
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('cancels pending show when mouse leaves before delay', () => {
    renderWithStrictMode(
      <Tooltip label="Test">
        <button>Click me</button>
      </Tooltip>,
    )

    const wrapper = screen.getByRole('button').parentElement!
    fireEvent.mouseEnter(wrapper)
    act(() => vi.advanceTimersByTime(100))
    fireEvent.mouseLeave(wrapper)
    act(() => vi.advanceTimersByTime(200))

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

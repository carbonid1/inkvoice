import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Select } from './Select'
import type { SelectGroup } from './Select.types'

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
]

const groups: SelectGroup[] = [
  {
    label: 'Letters',
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Bravo' },
    ],
  },
  {
    label: 'Numbers',
    options: [
      { value: '1', label: 'One' },
      { value: '2', label: 'Two' },
    ],
  },
]

const renderWith = (ui: React.ReactElement) => render(<StrictMode>{ui}</StrictMode>)

describe('Select', () => {
  it('renders selected label and chevron in button', () => {
    renderWith(<Select options={options} value="b" onChange={vi.fn()} />)

    const button = screen.getByRole('button', { name: /bravo/i })
    expect(button).toBeInTheDocument()
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('opens menu on click showing all options', () => {
    renderWith(<Select options={options} value="a" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /alpha/i }))

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /alpha/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /bravo/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /charlie/i })).toBeInTheDocument()
  })

  it('calls onChange and closes menu when an option is selected', () => {
    const onChange = vi.fn()
    renderWith(<Select options={options} value="a" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /alpha/i }))
    fireEvent.click(screen.getByRole('option', { name: /charlie/i }))

    expect(onChange).toHaveBeenCalledWith('c')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on Escape key', () => {
    renderWith(<Select options={options} value="a" onChange={vi.fn()} />)

    const button = screen.getByRole('button', { name: /alpha/i })
    fireEvent.click(button)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(button, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on click outside', () => {
    renderWith(<Select options={options} value="a" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /alpha/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('navigates with arrow keys and selects with Enter', () => {
    const onChange = vi.fn()
    renderWith(<Select options={options} value="a" onChange={onChange} />)

    const button = screen.getByRole('button', { name: /alpha/i })
    fireEvent.click(button)

    fireEvent.keyDown(button, { key: 'ArrowDown' })
    fireEvent.keyDown(button, { key: 'ArrowDown' })
    fireEvent.keyDown(button, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('renders groups with headers', () => {
    renderWith(<Select groups={groups} value="a" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /alpha/i }))

    expect(screen.getByText('Letters')).toBeInTheDocument()
    expect(screen.getByText('Numbers')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /one/i })).toBeInTheDocument()
  })

  it('uses renderOption for custom item rendering', () => {
    renderWith(
      <Select
        options={options}
        value="a"
        onChange={vi.fn()}
        renderOption={option => <span data-testid="custom">{option.label.toUpperCase()}</span>}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /alpha/i }))

    expect(screen.getAllByTestId('custom')).toHaveLength(3)
    expect(screen.getByText('BRAVO')).toBeInTheDocument()
  })

  it('shows placeholder when value does not match any option', () => {
    renderWith(<Select options={options} value="x" onChange={vi.fn()} placeholder="Pick one" />)

    expect(screen.getByRole('button', { name: /pick one/i })).toBeInTheDocument()
  })
})

import type { ReactNode } from 'react'

export type SelectOption = {
  value: string
  label: string
}

export type SelectGroup = {
  label: string
  options: SelectOption[]
}

export type SelectOptionState = {
  highlighted: boolean
  selected: boolean
}

export type SelectProps = {
  value: string
  onChange: (value: string) => void
  options?: SelectOption[]
  groups?: SelectGroup[]
  placeholder?: string
  id?: string
  className?: string
  menuClassName?: string
  renderOption?: (option: SelectOption, state: SelectOptionState) => ReactNode
  'aria-label'?: string
}

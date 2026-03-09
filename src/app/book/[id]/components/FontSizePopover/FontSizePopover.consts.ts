import type { FontSize } from '@/store/useDisplayStore'

type FontSizeOption = {
  value: FontSize
  label: string
}

export const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

export const FONT_SIZE_CLASS: Record<FontSize, string> = {
  small: 'text-base',
  medium: 'text-lg',
  large: 'text-xl',
}

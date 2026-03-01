'use client'

import { Select } from '@/components/Select/Select'
import type { SelectGroup, SelectOption } from '@/components/Select/Select.types'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useCallback, useMemo } from 'react'

type VoiceSelectProps = {
  voices: VoiceEntry[]
  value: string
  onChange: (name: string) => void
  placeholder?: string
  id?: string
  className?: string
  menuClassName?: string
  extraOptions?: SelectOption[]
  'aria-label'?: string
}

export const VoiceSelect = ({
  voices,
  value,
  onChange,
  placeholder,
  id,
  className,
  menuClassName,
  extraOptions,
  'aria-label': ariaLabel,
}: VoiceSelectProps) => {
  const groups: SelectGroup[] = useMemo(() => {
    const appVoices = voices.filter(v => v.type === 'app')
    const customVoices = voices.filter(v => v.type === 'custom')
    return [
      ...(appVoices.length > 0
        ? [
            {
              label: 'App Voices',
              options: appVoices.map(v => ({ value: v.name, label: v.displayName })),
            },
          ]
        : []),
      ...(customVoices.length > 0
        ? [
            {
              label: 'Custom Voices',
              options: customVoices.map(v => ({ value: v.name, label: v.displayName })),
            },
          ]
        : []),
    ]
  }, [voices])

  const voicesByName = useMemo(() => new Map(voices.map(v => [v.name, v])), [voices])

  const renderOption = useCallback(
    (option: SelectOption) => {
      const voice = voicesByName.get(option.value)
      if (!voice) return <span>{option.label}</span>
      return (
        <>
          <span>{voice.displayName}</span>
          {voice.tags.length > 0 && (
            <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {voice.tags.join(', ')}
            </span>
          )}
        </>
      )
    },
    [voicesByName],
  )

  return (
    <Select
      value={value}
      onChange={onChange}
      options={extraOptions}
      groups={groups}
      placeholder={placeholder}
      id={id}
      className={className}
      menuClassName={menuClassName}
      renderOption={renderOption}
      aria-label={ariaLabel}
    />
  )
}

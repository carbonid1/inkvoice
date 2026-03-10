'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import { VoiceSelect } from '@/components/VoiceSelect/VoiceSelect'
import { useBookVoice } from '@/lib/hooks/useBookVoice/useBookVoice'
import { useVoices } from '@/lib/hooks/useVoices/useVoices'
import { useMemo, useState } from 'react'

type VoiceSelectorProps = {
  bookId: string
}

const DEFAULT_SENTINEL = '__default__'

export const VoiceSelector = ({ bookId }: VoiceSelectorProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { voices, loading } = useVoices()
  const voiceNames = useMemo(() => voices.map(v => v.name), [voices])
  const { effectiveVoice, globalVoice, isOverridden, isStale, setVoice, clearVoice } = useBookVoice(
    bookId,
    voiceNames,
  )

  if (loading || voices.length === 0) {
    return <div className="w-28 h-7 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
  }

  const globalDisplayName = voices.find(v => v.name === globalVoice)?.displayName ?? globalVoice

  const handleChange = (value: string) => {
    if (value === DEFAULT_SENTINEL) {
      clearVoice()
    } else {
      setVoice(value)
    }
  }

  return (
    <div>
      <Tooltip label="Voice" position="bottom" disabled={dropdownOpen}>
        <VoiceSelect
          voices={voices}
          value={isOverridden ? effectiveVoice : DEFAULT_SENTINEL}
          onChange={handleChange}
          onOpenChange={setDropdownOpen}
          aria-label="Voice"
          className="text-sm bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-1 text-left"
          menuClassName="right-0"
          extraOptions={[{ value: DEFAULT_SENTINEL, label: `Default (${globalDisplayName})` }]}
        />
      </Tooltip>
      {isStale && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          Voice not found — using {effectiveVoice}
        </p>
      )}
    </div>
  )
}

'use client'

import { VoiceOptionGroups } from '@/components/VoiceOptionGroups/VoiceOptionGroups'
import { useBookVoice } from '@/lib/hooks/useBookVoice/useBookVoice'
import { useVoices } from '@/lib/hooks/useVoices/useVoices'
import { useMemo } from 'react'

type VoiceSelectorProps = {
  bookId: string
}

const DEFAULT_SENTINEL = '__default__'

export const VoiceSelector = ({ bookId }: VoiceSelectorProps) => {
  const { voices, loading } = useVoices()
  const voiceNames = useMemo(() => voices.map(v => v.name), [voices])
  const { effectiveVoice, globalVoice, isOverridden, isStale, setVoice, clearVoice } = useBookVoice(
    bookId,
    voiceNames,
  )

  if (loading || voices.length === 0) return null

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
      <select
        value={isOverridden ? effectiveVoice : DEFAULT_SENTINEL}
        onChange={e => handleChange(e.target.value)}
        aria-label="Voice"
        className="text-sm bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-1"
      >
        <option value={DEFAULT_SENTINEL}>Default ({globalDisplayName})</option>
        <VoiceOptionGroups voices={voices} />
      </select>
      {isStale && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          Voice not found — using {effectiveVoice}
        </p>
      )}
    </div>
  )
}

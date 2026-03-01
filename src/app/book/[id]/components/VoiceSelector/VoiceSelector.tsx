'use client'

import { VoiceOptionGroups } from '@/components/VoiceOptionGroups/VoiceOptionGroups'
import { useBookVoice } from '@/lib/hooks/useBookVoice/useBookVoice'
import { useVoices } from '@/lib/hooks/useVoices/useVoices'

type VoiceSelectorProps = {
  bookId: string
}

const DEFAULT_SENTINEL = '__default__'

export const VoiceSelector = ({ bookId }: VoiceSelectorProps) => {
  const { effectiveVoice, globalVoice, isOverridden, setVoice, clearVoice } = useBookVoice(bookId)
  const { voices, loading } = useVoices()

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
    <select
      value={isOverridden ? effectiveVoice : DEFAULT_SENTINEL}
      onChange={e => handleChange(e.target.value)}
      aria-label="Voice"
      className="text-sm bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-1"
    >
      <option value={DEFAULT_SENTINEL}>Default ({globalDisplayName})</option>
      <VoiceOptionGroups voices={voices} />
    </select>
  )
}

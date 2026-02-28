'use client'

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
      <option value={DEFAULT_SENTINEL}>Default ({globalVoice})</option>
      {voices.map(v => (
        <option key={v.name} value={v.name}>
          {v.name}
        </option>
      ))}
    </select>
  )
}

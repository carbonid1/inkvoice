'use client'

import { useUpdateVoiceTags } from '@/lib/hooks/useUpdateVoiceTags/useUpdateVoiceTags'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useCallback, useEffect, useState } from 'react'
import type { PlayingState } from '../hooks/useVoicePreview/useVoicePreview.types'
import { VoiceRow } from './VoiceRow'

type VoiceListProps = {
  voices: VoiceEntry[]
  playing: PlayingState
  onPlay: (name: string, type: 'source' | 'sample') => void
  onDelete: (name: string) => void
  deleting: boolean
}

export const VoiceList = ({ voices, playing, onPlay, onDelete, deleting }: VoiceListProps) => {
  const [expandedVoice, setExpandedVoice] = useState<string | null>(null)
  const [localVoices, setLocalVoices] = useState(voices)
  const { saving, updateTags } = useUpdateVoiceTags()

  useEffect(() => {
    setLocalVoices(voices)
  }, [voices])

  const handleTagsChanged = useCallback(
    async (voiceName: string, tags: string[]) => {
      setLocalVoices(prev => prev.map(v => (v.name === voiceName ? { ...v, tags } : v)))
      const result = await updateTags(voiceName, tags)
      if (result) {
        setLocalVoices(prev => prev.map(v => (v.name === voiceName ? { ...v, tags: result } : v)))
      }
    },
    [updateTags],
  )

  const toggleExpanded = useCallback((name: string) => {
    setExpandedVoice(prev => (prev === name ? null : name))
  }, [])

  const appVoices = localVoices.filter(v => v.type === 'app')
  const customVoices = localVoices.filter(v => v.type === 'custom')

  if (localVoices.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">No voices available</p>
  }

  return (
    <div className="space-y-1">
      {appVoices.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            App Voices
          </h3>
          {appVoices.map(voice => (
            <VoiceRow
              key={voice.name}
              voice={voice}
              expanded={expandedVoice === voice.name}
              onToggle={() => toggleExpanded(voice.name)}
              playing={playing}
              onPlay={onPlay}
              onTagsChanged={handleTagsChanged}
              tagsSaving={saving}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {customVoices.length > 0 && (
        <div className={appVoices.length > 0 ? 'mt-3' : ''}>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Custom Voices
          </h3>
          {customVoices.map(voice => (
            <VoiceRow
              key={voice.name}
              voice={voice}
              expanded={expandedVoice === voice.name}
              onToggle={() => toggleExpanded(voice.name)}
              playing={playing}
              onPlay={onPlay}
              onDelete={onDelete}
              onTagsChanged={handleTagsChanged}
              tagsSaving={saving}
              deleting={deleting}
            />
          ))}
        </div>
      )}
    </div>
  )
}

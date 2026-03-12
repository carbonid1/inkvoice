'use client'

import { useUpdateVoiceTags } from '@/lib/hooks/useUpdateVoiceTags/useUpdateVoiceTags'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useCallback, useEffect, useState } from 'react'
import type { AudioType, PlayingState } from '../hooks/useVoicePreview/useVoicePreview.types'
import { VoiceRow } from './VoiceRow'

type VoiceListProps = {
  voices: VoiceEntry[]
  selectedVoice: string
  onSelect: (name: string) => void
  playing: PlayingState
  onPlay: (name: string, type: AudioType) => void
  onDelete: (name: string) => void
}

export const VoiceList = ({
  voices,
  selectedVoice,
  onSelect,
  playing,
  onPlay,
  onDelete,
}: VoiceListProps) => {
  const [customParent] = useAutoAnimate()
  const [appParent] = useAutoAnimate()
  const [editingTagsVoice, setEditingTagsVoice] = useState<string | null>(null)
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

  const toggleTagEditor = useCallback((name: string) => {
    setEditingTagsVoice(prev => (prev === name ? null : name))
  }, [])

  const customVoices = localVoices.filter(v => v.type === 'custom')
  const appVoices = localVoices.filter(v => v.type === 'app')

  if (localVoices.length === 0) {
    return <p className="text-muted-foreground text-sm">No voices available</p>
  }

  return (
    <div className="space-y-4">
      {customVoices.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Your Voices
            <span className="text-muted-foreground"> &middot; {customVoices.length}</span>
          </h3>
          <div ref={customParent} className="space-y-1">
            {customVoices.map(voice => (
              <VoiceRow
                key={voice.name}
                voice={voice}
                selected={voice.name === selectedVoice}
                editingTags={editingTagsVoice === voice.name}
                onSelect={() => onSelect(voice.name)}
                onToggleTagEditor={() => toggleTagEditor(voice.name)}
                playing={playing}
                onPlay={onPlay}
                onDelete={onDelete}
                onTagsChanged={handleTagsChanged}
                tagsSaving={saving}
              />
            ))}
          </div>
        </div>
      )}

      {appVoices.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Included Voices
            <span className="text-muted-foreground"> &middot; {appVoices.length}</span>
          </h3>
          <div ref={appParent} className="space-y-1">
            {appVoices.map(voice => (
              <VoiceRow
                key={voice.name}
                voice={voice}
                selected={voice.name === selectedVoice}
                editingTags={editingTagsVoice === voice.name}
                onSelect={() => onSelect(voice.name)}
                onToggleTagEditor={() => toggleTagEditor(voice.name)}
                playing={playing}
                onPlay={onPlay}
                onTagsChanged={handleTagsChanged}
                tagsSaving={saving}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

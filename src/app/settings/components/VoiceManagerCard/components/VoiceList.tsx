'use client'

import { useUpdateVoiceTags } from '@/lib/hooks/useUpdateVoiceTags/useUpdateVoiceTags'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import type { AudioType, PlayingState } from '../hooks/useVoicePreview/useVoicePreview.types'
import { VoiceRow } from './VoiceRow'

type VoiceListProps = {
  voices: VoiceEntry[]
  selectedVoice: string
  onSelect: (name: string) => void
  playing: PlayingState
  onPlay: (name: string, type: AudioType) => void
  onDelete: (name: string) => void
  uploadSection?: ReactNode
}

export const VoiceList = ({
  voices,
  selectedVoice,
  onSelect,
  playing,
  onPlay,
  onDelete,
  uploadSection,
}: VoiceListProps) => {
  const [customParent] = useAutoAnimate()
  const [appParent] = useAutoAnimate()
  const [editingTagsVoice, setEditingTagsVoice] = useState<string | null>(null)
  const [tagOverrides, setTagOverrides] = useState<Record<string, string[]>>({})
  const { saving, updateTags } = useUpdateVoiceTags()

  const localVoices = useMemo(
    () =>
      voices.map(v => {
        const override = tagOverrides[v.name]
        return override ? { ...v, tags: override } : v
      }),
    [voices, tagOverrides],
  )

  const handleTagsChanged = useCallback(
    async (voiceName: string, tags: string[]) => {
      setTagOverrides(prev => ({ ...prev, [voiceName]: tags }))
      const result = await updateTags(voiceName, tags)
      if (result) {
        setTagOverrides(prev => ({ ...prev, [voiceName]: result }))
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
      <div>
        <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
          Your Voices
          {customVoices.length > 0 && (
            <span className="text-muted-foreground"> &middot; {customVoices.length}</span>
          )}
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
          {uploadSection}
        </div>
      </div>

      {appVoices.length > 0 && (
        <div>
          <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
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

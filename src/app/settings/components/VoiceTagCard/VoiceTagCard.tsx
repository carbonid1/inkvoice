'use client'

import { VoiceTagList } from '@/components/VoiceTagList/VoiceTagList'
import { useUpdateVoiceTags } from '@/lib/hooks/useUpdateVoiceTags/useUpdateVoiceTags'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useCallback, useEffect, useState } from 'react'
import { VoiceTagEditor } from '../VoiceTagEditor/VoiceTagEditor'

type VoiceTagCardProps = {
  voices: VoiceEntry[]
}

export const VoiceTagCard = ({ voices }: VoiceTagCardProps) => {
  const [expandedVoice, setExpandedVoice] = useState<string | null>(null)
  const [localVoices, setLocalVoices] = useState(voices)
  const { saving, updateTags } = useUpdateVoiceTags()

  useEffect(() => {
    setLocalVoices(voices)
  }, [voices])

  const handleTagsChanged = useCallback(
    async (voiceName: string, tags: string[]) => {
      // Optimistic local update — no refetch needed
      setLocalVoices(prev => prev.map(v => (v.name === voiceName ? { ...v, tags } : v)))
      const result = await updateTags(voiceName, tags)
      if (result) {
        // Sync with normalized server tags
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

  const renderVoiceRow = (voice: VoiceEntry) => {
    const isExpanded = expandedVoice === voice.name

    return (
      <div key={voice.name} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
        <button
          type="button"
          onClick={() => toggleExpanded(voice.name)}
          className="w-full flex items-center gap-3 py-2 px-1 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors"
        >
          <span className="text-xs text-gray-400 select-none">
            {isExpanded ? '\u25BC' : '\u25B6'}
          </span>
          <span className="font-medium text-sm">{voice.displayName}</span>
          {!isExpanded && voice.tags.length > 0 && <VoiceTagList tags={voice.tags} />}
        </button>
        {isExpanded && (
          <div className="pl-6 pb-3">
            <VoiceTagEditor
              tags={voice.tags}
              onTagsChanged={tags => handleTagsChanged(voice.name, tags)}
              saving={saving}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Voice Tags</h2>

      {localVoices.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No voices available</p>
      ) : (
        <div className="space-y-1">
          {appVoices.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                App Voices
              </h3>
              {appVoices.map(renderVoiceRow)}
            </div>
          )}
          {customVoices.length > 0 && (
            <div className="mt-3">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Custom Voices
              </h3>
              {customVoices.map(renderVoiceRow)}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Click a voice to add or remove tags. Tags help identify voice characteristics.
      </p>
    </div>
  )
}

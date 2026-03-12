'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { Pencil, Play, Square, Volume2, X } from 'lucide-react'
import { VoiceTagEditor } from '../../VoiceTagEditor/VoiceTagEditor'
import { VoiceTagList } from '../../VoiceTagList/VoiceTagList'
import type { AudioType, PlayingState } from '../hooks/useVoicePreview/useVoicePreview.types'

type VoiceRowProps = {
  voice: VoiceEntry
  selected: boolean
  editingTags: boolean
  onSelect: () => void
  onToggleTagEditor: () => void
  playing: PlayingState
  onPlay: (name: string, type: AudioType) => void
  onDelete?: (name: string) => void
  onTagsChanged: (name: string, tags: string[]) => void
  tagsSaving: boolean
}

const isPlaying = (playing: PlayingState, name: string, type: AudioType) =>
  playing?.name === name && playing?.type === type

export const VoiceRow = ({
  voice,
  selected,
  editingTags,
  onSelect,
  onToggleTagEditor,
  playing,
  onPlay,
  onDelete,
  onTagsChanged,
  tagsSaving,
}: VoiceRowProps) => {
  const playingSource = isPlaying(playing, voice.name, 'source')
  const playingSample = isPlaying(playing, voice.name, 'sample')
  const showSampleButton = voice.hasSample || voice.type === 'custom'
  const sampleGenerating = showSampleButton && !voice.hasSample

  return (
    <div
      className={`group rounded-lg transition-colors ${
        selected
          ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800'
          : 'hover:bg-accent'
      }`}
    >
      <div className="flex items-center gap-2 py-2.5 px-3">
        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? 'true' : undefined}
          data-voice={voice.name}
          className="flex items-center gap-3 flex-1 text-left rounded transition-colors min-w-0 cursor-pointer"
        >
          <span className="font-medium text-sm truncate">{voice.displayName}</span>
          {voice.tags.length > 0 && <VoiceTagList tags={voice.tags} />}
        </button>

        <div
          className={`flex items-center gap-1 shrink-0 transition-opacity ${
            selected || editingTags || playingSource || playingSample
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Tooltip label={playingSource ? 'Stop' : 'Play source audio'}>
            <button
              type="button"
              onClick={() => onPlay(voice.name, 'source')}
              aria-label={playingSource ? 'Stop' : `Play source audio for ${voice.displayName}`}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
            >
              {playingSource ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </Tooltip>

          {showSampleButton && (
            <Tooltip
              label={
                sampleGenerating
                  ? 'Generating sample...'
                  : playingSample
                    ? 'Stop'
                    : 'Play voice sample'
              }
            >
              <button
                type="button"
                onClick={() => onPlay(voice.name, 'sample')}
                disabled={sampleGenerating}
                aria-label={
                  sampleGenerating
                    ? `Generating sample for ${voice.displayName}`
                    : playingSample
                      ? 'Stop'
                      : `Play voice sample for ${voice.displayName}`
                }
                className={`p-2 transition-colors ${
                  sampleGenerating
                    ? 'opacity-40 animate-pulse cursor-not-allowed'
                    : 'text-gray-400 hover:text-blue-500 cursor-pointer'
                }`}
              >
                {playingSample ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </Tooltip>
          )}

          <Tooltip label="Edit tags">
            <button
              type="button"
              onClick={onToggleTagEditor}
              aria-label={`Edit tags for ${voice.displayName}`}
              className={`p-2 transition-colors cursor-pointer ${
                editingTags ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
              }`}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </Tooltip>

          {onDelete && (
            <Tooltip label={`Remove "${voice.displayName}"`}>
              <button
                type="button"
                onClick={() => onDelete(voice.name)}
                aria-label={`Remove ${voice.displayName}`}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {editingTags && (
        <div className="pl-6 pb-3">
          <VoiceTagEditor
            tags={voice.tags}
            onTagsChanged={tags => onTagsChanged(voice.name, tags)}
            saving={tagsSaving}
          />
        </div>
      )}
    </div>
  )
}

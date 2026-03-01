'use client'

import { CloseIcon } from '@/components/icons/CloseIcon'
import { PencilIcon } from '@/components/icons/PencilIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'
import { SpeakerIcon } from '@/components/icons/SpeakerIcon'
import { StopIcon } from '@/components/icons/StopIcon'
import { Tooltip } from '@/components/Tooltip/Tooltip'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
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
  deleting: boolean
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
  deleting,
}: VoiceRowProps) => {
  const playingSource = isPlaying(playing, voice.name, 'source')
  const playingSample = isPlaying(playing, voice.name, 'sample')

  return (
    <div
      className={`group border-b border-gray-100 dark:border-gray-700 transition-colors border-l-2 ${
        selected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500' : 'border-l-transparent'
      }`}
    >
      <div className="flex items-center gap-2 py-2 px-1">
        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? 'true' : undefined}
          data-voice={voice.name}
          className="flex items-center gap-3 flex-1 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors py-0.5 px-1 min-w-0 cursor-pointer"
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
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
            >
              {playingSource ? (
                <StopIcon className="w-3.5 h-3.5" />
              ) : (
                <PlayIcon className="w-3.5 h-3.5" />
              )}
            </button>
          </Tooltip>

          {voice.hasSample && (
            <Tooltip label={playingSample ? 'Stop' : 'Play voice sample'}>
              <button
                type="button"
                onClick={() => onPlay(voice.name, 'sample')}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
              >
                {playingSample ? (
                  <StopIcon className="w-3.5 h-3.5" />
                ) : (
                  <SpeakerIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </Tooltip>
          )}

          <Tooltip label="Edit tags">
            <button
              type="button"
              onClick={onToggleTagEditor}
              className={`p-1 transition-colors cursor-pointer ${
                editingTags ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
              }`}
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {onDelete && (
            <Tooltip label={`Remove "${voice.displayName}"`}>
              <button
                type="button"
                onClick={() => onDelete(voice.name)}
                disabled={deleting}
                className="p-1 text-gray-400 hover:text-red-500 disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors cursor-pointer"
              >
                <CloseIcon className="w-3.5 h-3.5" />
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

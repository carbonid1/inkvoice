'use client'

import { CloseIcon } from '@/components/icons/CloseIcon'
import { PencilIcon } from '@/components/icons/PencilIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'
import { SpeakerIcon } from '@/components/icons/SpeakerIcon'
import { StopIcon } from '@/components/icons/StopIcon'
import { Tooltip } from '@/components/Tooltip/Tooltip'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useState } from 'react'
import { VoiceTagEditor } from '../../VoiceTagEditor/VoiceTagEditor'
import { VoiceTagList } from '../../VoiceTagList/VoiceTagList'
import type { AudioType, PlayingState } from '../hooks/useVoicePreview/useVoicePreview.types'
import { VoiceAvatar } from './VoiceAvatar'

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
  deletingVoice: string | null
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
  deletingVoice,
}: VoiceRowProps) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const playingSource = isPlaying(playing, voice.name, 'source')
  const playingSample = isPlaying(playing, voice.name, 'sample')

  return (
    <div
      className={`group rounded-lg transition-colors ${
        selected
          ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
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
          <VoiceAvatar displayName={voice.displayName} type={voice.type} />
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
              {playingSource ? <StopIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            </button>
          </Tooltip>

          {voice.hasSample && (
            <Tooltip label={playingSample ? 'Stop' : 'Play voice sample'}>
              <button
                type="button"
                onClick={() => onPlay(voice.name, 'sample')}
                aria-label={playingSample ? 'Stop' : `Play voice sample for ${voice.displayName}`}
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
              >
                {playingSample ? (
                  <StopIcon className="w-4 h-4" />
                ) : (
                  <SpeakerIcon className="w-4 h-4" />
                )}
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
              <PencilIcon className="w-4 h-4" />
            </button>
          </Tooltip>

          {onDelete && !confirmingDelete && (
            <Tooltip label={`Remove "${voice.displayName}"`}>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={deletingVoice === voice.name}
                aria-label={`Remove ${voice.displayName}`}
                className="p-2 text-gray-400 hover:text-red-500 disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </Tooltip>
          )}

          {confirmingDelete && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-gray-400">Delete?</span>
              <button
                type="button"
                onClick={() => {
                  onDelete?.(voice.name)
                  setConfirmingDelete(false)
                }}
                className="px-2 py-0.5 text-xs rounded bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
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

'use client'

import { CloseIcon } from '@/components/icons/CloseIcon'
import { PlayIcon } from '@/components/icons/PlayIcon'
import { StopIcon } from '@/components/icons/StopIcon'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { VoiceTagEditor } from '../../VoiceTagEditor/VoiceTagEditor'
import { VoiceTagList } from '../../VoiceTagList/VoiceTagList'
import type { PlayingState } from '../hooks/useVoicePreview/useVoicePreview.types'

type VoiceRowProps = {
  voice: VoiceEntry
  expanded: boolean
  onToggle: () => void
  playing: PlayingState
  onPlay: (name: string, type: 'source' | 'sample') => void
  onDelete?: (name: string) => void
  onTagsChanged: (name: string, tags: string[]) => void
  tagsSaving: boolean
  deleting: boolean
}

const isPlaying = (playing: PlayingState, name: string, type: 'source' | 'sample') =>
  playing?.name === name && playing?.type === type

export const VoiceRow = ({
  voice,
  expanded,
  onToggle,
  playing,
  onPlay,
  onDelete,
  onTagsChanged,
  tagsSaving,
  deleting,
}: VoiceRowProps) => (
  <div className="border-b border-gray-100 dark:border-gray-700 last:border-0">
    <div className="flex items-center gap-2 py-2 px-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 flex-1 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors py-0.5 px-1 min-w-0"
      >
        <span className="text-xs text-gray-400 select-none shrink-0">
          {expanded ? '\u25BC' : '\u25B6'}
        </span>
        <span className="font-medium text-sm truncate">{voice.displayName}</span>
        {!expanded && voice.tags.length > 0 && <VoiceTagList tags={voice.tags} />}
      </button>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onPlay(voice.name, 'source')}
          className="p-1 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
          title={isPlaying(playing, voice.name, 'source') ? 'Stop' : 'Play source'}
        >
          {isPlaying(playing, voice.name, 'source') ? (
            <StopIcon className="w-3.5 h-3.5" />
          ) : (
            <PlayIcon className="w-3.5 h-3.5" />
          )}
        </button>

        {voice.hasSample && (
          <button
            type="button"
            onClick={() => onPlay(voice.name, 'sample')}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
            title={isPlaying(playing, voice.name, 'sample') ? 'Stop' : 'Play sample'}
          >
            {isPlaying(playing, voice.name, 'sample') ? (
              <StopIcon className="w-3.5 h-3.5" />
            ) : (
              <PlayIcon className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(voice.name)}
            disabled={deleting}
            className="p-1 text-gray-400 hover:text-red-500 disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors cursor-pointer"
            title={`Remove "${voice.displayName}"`}
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>

    {expanded && (
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

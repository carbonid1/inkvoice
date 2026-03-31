'use client'

import { Tooltip } from '@/components/Tooltip/Tooltip'
import { Button } from '@/components/ui/Button/Button'
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
          ? 'bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:ring-blue-800'
          : 'hover:bg-accent'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? 'true' : undefined}
          data-voice={voice.name}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-sm text-left transition-colors"
        >
          <span className="shrink-0 text-sm font-medium whitespace-nowrap">
            {voice.displayName}
          </span>
          {voice.tags.length > 0 && <VoiceTagList tags={voice.tags} />}
        </button>

        <div
          className={`flex shrink-0 items-center gap-1 transition-opacity ${
            selected || editingTags || playingSource || playingSample
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Tooltip label={playingSource ? 'Stop' : 'Play source audio'}>
            <Button
              variant="subtle"
              size="icon"
              onClick={() => onPlay(voice.name, 'source')}
              aria-label={playingSource ? 'Stop' : `Play source audio for ${voice.displayName}`}
            >
              {playingSource ? <Square className="size-4" /> : <Play className="size-4" />}
            </Button>
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
              <Button
                variant="subtle"
                size="icon"
                onClick={() => onPlay(voice.name, 'sample')}
                disabled={sampleGenerating}
                aria-label={
                  sampleGenerating
                    ? `Generating sample for ${voice.displayName}`
                    : playingSample
                      ? 'Stop'
                      : `Play voice sample for ${voice.displayName}`
                }
                className={sampleGenerating ? 'animate-pulse opacity-40' : ''}
              >
                {playingSample ? <Square className="size-4" /> : <Volume2 className="size-4" />}
              </Button>
            </Tooltip>
          )}

          {voice.type === 'custom' && (
            <Tooltip label="Edit tags">
              <Button
                variant="subtle"
                size="icon"
                onClick={onToggleTagEditor}
                aria-label={`Edit tags for ${voice.displayName}`}
                className={editingTags ? 'text-blue-500' : ''}
              >
                <Pencil className="size-4" />
              </Button>
            </Tooltip>
          )}

          {onDelete && (
            <Tooltip label={`Remove "${voice.displayName}"`}>
              <Button
                variant="danger"
                size="icon"
                onClick={() => onDelete(voice.name)}
                aria-label={`Remove ${voice.displayName}`}
              >
                <X className="size-4" />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {editingTags && voice.type === 'custom' && (
        <div className="pb-3 pl-6">
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

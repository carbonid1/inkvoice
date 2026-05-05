'use client'

import { Button, Tooltip } from '@carbonid1/design-system'
import { Pencil, Play, Square, Volume2, X } from 'lucide-react'
import { VoiceSourceBadge } from '@/components/VoiceSourceBadge/VoiceSourceBadge'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { VoiceTagEditor } from '../../VoiceTagEditor/VoiceTagEditor'
import { VoiceTagList } from '../../VoiceTagList/VoiceTagList'
import type { AudioType, PlayingState } from '../hooks/useVoicePreview/useVoicePreview.types'

interface VoiceRowProps {
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

// Stable per-voice hue so each row gets a distinct, recognizable swatch — gives
// the list visual texture even when a voice has no tags.
const hueFor = (name: string): number => {
  let hash = 0

  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return hash % 360
}

const SWATCH_BG = { saturation: 65, lightness: 55, alpha: 0.18 }
const SWATCH_ICON = { saturation: 70, lightness: 60 }

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
  const previewType: AudioType = showSampleButton ? 'sample' : 'source'
  const previewPlaying = previewType === 'sample' ? playingSample : playingSource
  const previewLoading = previewType === 'sample' && sampleGenerating

  const hue = hueFor(voice.name)
  const swatchStyle = {
    backgroundColor: `hsl(${hue} ${SWATCH_BG.saturation}% ${SWATCH_BG.lightness}% / ${SWATCH_BG.alpha})`,
  }
  const swatchIconStyle = {
    color: `hsl(${hue} ${SWATCH_ICON.saturation}% ${SWATCH_ICON.lightness}%)`,
  }

  const previewLabel = (withName: boolean) => {
    if (previewLoading)
      return withName ? `Generating sample for ${voice.displayName}` : 'Generating sample…'
    if (previewPlaying) return 'Stop'
    if (previewType === 'sample') {
      return withName ? `Play voice sample for ${voice.displayName}` : 'Play voice sample'
    }
    return withName ? `Play source audio for ${voice.displayName}` : 'Play source audio'
  }

  return (
    <div
      className={`group rounded-lg transition-colors ${
        selected || editingTags ? 'bg-primary-muted ring-primary-border ring-1' : 'hover:bg-accent'
      }`}
    >
      <div className="flex items-center gap-3 px-2 py-1.5">
        <Tooltip label={previewLabel(false)}>
          <button
            type="button"
            onClick={() => onPlay(voice.name, previewType)}
            disabled={previewLoading}
            aria-label={previewLabel(true)}
            style={swatchStyle}
            className={`relative flex size-9 shrink-0 items-center justify-center rounded-md transition-transform hover:scale-105 active:scale-95 ${
              previewLoading ? 'animate-pulse opacity-60' : ''
            }`}
          >
            {previewPlaying ? (
              <Square className="size-4" style={swatchIconStyle} fill="currentColor" />
            ) : (
              <Play className="size-4" style={swatchIconStyle} fill="currentColor" />
            )}
          </button>
        </Tooltip>

        <button
          type="button"
          onClick={onSelect}
          aria-current={selected ? 'true' : undefined}
          data-voice={voice.name}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-sm py-1 text-left"
        >
          <span data-voice-name className="shrink-0 text-sm font-medium">
            {voice.displayName}
          </span>
          <VoiceSourceBadge source={voice.source} />
          {voice.tags.length > 0 && <VoiceTagList tags={voice.tags} />}
        </button>

        <div
          className={`flex shrink-0 items-center gap-1 transition-opacity ${
            selected || editingTags || playingSource
              ? 'opacity-100'
              : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'
          }`}
        >
          {previewType === 'sample' && (
            <Tooltip label={playingSource ? 'Stop' : 'Play source audio'}>
              <Button
                variant="subtle"
                size="icon"
                onClick={() => onPlay(voice.name, 'source')}
                aria-label={playingSource ? 'Stop' : `Play source audio for ${voice.displayName}`}
              >
                {playingSource ? <Square /> : <Volume2 />}
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
                className={editingTags ? 'text-primary' : ''}
              >
                <Pencil />
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
                <X />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {editingTags && voice.type === 'custom' && (
        <div className="pb-3 pl-14">
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

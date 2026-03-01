'use client'

import { PlayIcon } from '@/components/icons/PlayIcon'
import { StopIcon } from '@/components/icons/StopIcon'
import { VoiceSelect } from '@/components/VoiceSelect/VoiceSelect'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import type { PlayingState } from '../hooks/useVoicePreview/useVoicePreview.types'

type DefaultVoiceSectionProps = {
  voices: VoiceEntry[]
  voice: string
  onVoiceChange: (name: string) => void
  playing: PlayingState
  onPlay: (name: string, type: 'source' | 'sample') => void
  error: string | null
}

export const DefaultVoiceSection = ({
  voices,
  voice,
  onVoiceChange,
  playing,
  onPlay,
  error,
}: DefaultVoiceSectionProps) => {
  const currentVoiceInfo = voices.find(v => v.name === voice)

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="voice-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Default Voice
        </label>
        <div className="flex gap-2">
          <VoiceSelect
            id="voice-select"
            voices={voices}
            value={voice}
            onChange={onVoiceChange}
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left"
          />
          <button
            onClick={() => onPlay(voice, 'source')}
            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm cursor-pointer"
            title={
              playing?.name === voice && playing?.type === 'source'
                ? 'Stop'
                : 'Listen to source audio'
            }
          >
            {playing?.name === voice && playing?.type === 'source' ? (
              <StopIcon />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
            Source
          </button>
          <button
            onClick={() => onPlay(voice, 'sample')}
            disabled={!currentVoiceInfo?.hasSample}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm ${
              currentVoiceInfo?.hasSample
                ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            title={
              !currentVoiceInfo?.hasSample
                ? 'No sample available'
                : playing?.name === voice && playing?.type === 'sample'
                  ? 'Stop'
                  : 'Listen to TTS sample'
            }
          >
            {playing?.name === voice && playing?.type === 'sample' ? (
              <StopIcon />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
            Sample
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Voice changes apply to new audio generation. Cached audio will use the original settings.
      </p>
    </div>
  )
}

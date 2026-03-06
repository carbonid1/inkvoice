'use client'

import { useDeleteVoice } from '@/lib/hooks/useDeleteVoice/useDeleteVoice'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useVoiceStore } from '@/store/useVoiceStore'
import { VoiceList } from './components/VoiceList'
import { VoiceListSkeleton } from './components/VoiceListSkeleton'
import { VoiceUploadSection } from './components/VoiceUploadSection'
import { useVoicePreview } from './hooks/useVoicePreview/useVoicePreview'

type VoiceManagerCardProps = {
  voices: VoiceEntry[]
  loading: boolean
  onVoicesChanged: () => void
}

export const VoiceManagerCard = ({ voices, loading, onVoicesChanged }: VoiceManagerCardProps) => {
  const voice = useVoiceStore(s => s.voice)
  const setVoice = useVoiceStore(s => s.setVoice)
  const clearVoiceFromAllBooks = useVoiceStore(s => s.clearVoiceFromAllBooks)
  const { playing, error: previewError, play } = useVoicePreview()
  const { deletingVoice, deleteVoice } = useDeleteVoice()

  const handleDelete = async (voiceName: string) => {
    const deleted = await deleteVoice(voiceName)
    if (!deleted) return
    clearVoiceFromAllBooks(voiceName)
    onVoicesChanged()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-2">Voices</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Choose a voice for your narration. Changing voices will re-generate any unheard audio.
      </p>

      {loading ? (
        <VoiceListSkeleton />
      ) : voices.length === 0 ? (
        <div className="text-gray-500">
          <p>No voices found.</p>
          <p className="text-sm mt-2">
            Add voices to{' '}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
              data/voices/&lt;name&gt;/source.wav
            </code>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <VoiceList
            voices={voices}
            selectedVoice={voice}
            onSelect={setVoice}
            playing={playing}
            onPlay={play}
            onDelete={handleDelete}
            deletingVoice={deletingVoice}
          />

          {previewError && (
            <p className="text-sm text-amber-600 dark:text-amber-400">{previewError}</p>
          )}

          <VoiceUploadSection onVoicesChanged={onVoicesChanged} />
        </div>
      )}
    </div>
  )
}

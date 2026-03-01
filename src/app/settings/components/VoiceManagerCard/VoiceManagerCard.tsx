'use client'

import { useDeleteVoice } from '@/lib/hooks/useDeleteVoice/useDeleteVoice'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useVoiceStore } from '@/store/useVoiceStore'
import { DefaultVoiceSection } from './components/DefaultVoiceSection'
import { VoiceList } from './components/VoiceList'
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
  const { deleting, deleteVoice } = useDeleteVoice()

  const handleDelete = async (voiceName: string) => {
    const deleted = await deleteVoice(voiceName)
    if (!deleted) return
    clearVoiceFromAllBooks(voiceName)
    onVoicesChanged()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Voices</h2>

      {loading ? (
        <div className="text-gray-500">Loading voices...</div>
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
        <div className="space-y-6">
          <DefaultVoiceSection
            voices={voices}
            voice={voice}
            onVoiceChange={setVoice}
            playing={playing}
            onPlay={play}
            error={previewError}
          />

          <hr className="border-gray-200 dark:border-gray-700" />

          <VoiceList
            voices={voices}
            playing={playing}
            onPlay={play}
            onDelete={handleDelete}
            deleting={deleting}
          />

          <hr className="border-gray-200 dark:border-gray-700" />

          <VoiceUploadSection onVoicesChanged={onVoicesChanged} />
        </div>
      )}
    </div>
  )
}

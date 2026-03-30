'use client'

import { getModKey } from '@/lib/helpers/getModKey/getModKey'
import { useDeleteVoice } from '@/lib/hooks/useDeleteVoice/useDeleteVoice'
import type { VoiceEntry } from '@/lib/services/voice/voice.types'
import { useVoiceStore } from '@/store/useVoiceStore'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { VoiceList } from './components/VoiceList'
import { VoiceListSkeleton } from './components/VoiceListSkeleton'
import { VoiceUploadSection } from './components/VoiceUploadSection/VoiceUploadSection'
import { useVoicePreview } from './hooks/useVoicePreview/useVoicePreview'

type UndoState = {
  voiceName: string
  previousVoice: string
  previousBookVoices: Record<string, string>
}

type VoiceManagerCardProps = {
  voices: VoiceEntry[]
  loading: boolean
  onVoicesChanged: () => void
}

export const VoiceManagerCard = ({ voices, loading, onVoicesChanged }: VoiceManagerCardProps) => {
  const voice = useVoiceStore(s => s.voice)
  const setVoice = useVoiceStore(s => s.setVoice)
  const setBookVoice = useVoiceStore(s => s.setBookVoice)
  const clearVoiceFromAllBooks = useVoiceStore(s => s.clearVoiceFromAllBooks)
  const { playing, error: previewError, play } = useVoicePreview()
  const { deleteVoice, restoreVoice } = useDeleteVoice()

  const [hiddenVoices, setHiddenVoices] = useState<Set<string>>(new Set())
  const lastDeletedRef = useRef<UndoState | null>(null)

  const unhideVoice = useCallback((name: string) => {
    setHiddenVoices(prev => {
      const next = new Set(prev)
      next.delete(name)
      return next
    })
  }, [])

  const restoreVoiceAssignments = useCallback(
    (undoState: UndoState) => {
      if (undoState.previousVoice === undoState.voiceName) setVoice(undoState.voiceName)
      Object.entries(undoState.previousBookVoices)
        .filter(([, v]) => v === undoState.voiceName)
        .forEach(([bookId]) => setBookVoice(bookId, undoState.voiceName))
    },
    [setVoice, setBookVoice],
  )

  const handleUndo = useCallback(async () => {
    const undoState = lastDeletedRef.current
    if (!undoState) return
    lastDeletedRef.current = null

    unhideVoice(undoState.voiceName)
    toast.dismiss()

    const restored = await restoreVoice(undoState.voiceName)
    if (!restored) {
      toast.error('Failed to restore voice')
      return
    }
    restoreVoiceAssignments(undoState)
    onVoicesChanged()
  }, [unhideVoice, restoreVoice, restoreVoiceAssignments, onVoicesChanged])

  useHotkeys('mod+z', handleUndo)

  const handleDelete = useCallback(
    (voiceName: string) => {
      setHiddenVoices(prev => new Set(prev).add(voiceName))

      const previousVoice = useVoiceStore.getState().voice
      const previousBookVoices = { ...useVoiceStore.getState().bookVoices }
      clearVoiceFromAllBooks(voiceName)

      const undoState: UndoState = { voiceName, previousVoice, previousBookVoices }
      lastDeletedRef.current = undoState

      toast.dismiss()
      toast('Voice removed', {
        description: `${getModKey()}+Z to undo`,
        action: {
          label: 'Undo',
          onClick: () => {
            handleUndo()
          },
        },
        duration: 5000,
      })

      deleteVoice(voiceName).then(deleted => {
        if (!deleted) {
          unhideVoice(voiceName)
          lastDeletedRef.current = null
          restoreVoiceAssignments(undoState)
          toast.error('Failed to delete voice')
        }
        onVoicesChanged()
      })
    },
    [
      clearVoiceFromAllBooks,
      deleteVoice,
      handleUndo,
      unhideVoice,
      restoreVoiceAssignments,
      onVoicesChanged,
    ],
  )

  const visibleVoices = useMemo(
    () => voices.filter(v => !hiddenVoices.has(v.name)),
    [voices, hiddenVoices],
  )

  return (
    <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
      <h2 className="text-lg font-semibold mb-2">Voices</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Choose a voice for your narration. Changing voices will re-generate any unheard audio.
      </p>

      {loading ? (
        <VoiceListSkeleton />
      ) : visibleVoices.length === 0 ? (
        <div className="text-gray-500">
          <p>No voices found.</p>
          <p className="text-sm mt-2">
            Add voices to{' '}
            <code className="bg-muted px-1 rounded">data/voices/&lt;name&gt;/source.wav</code>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <VoiceList
            voices={visibleVoices}
            selectedVoice={voice}
            onSelect={setVoice}
            playing={playing}
            onPlay={play}
            onDelete={handleDelete}
          />

          {previewError && <p className="text-sm text-attention-foreground">{previewError}</p>}

          <VoiceUploadSection onVoicesChanged={onVoicesChanged} />
        </div>
      )}
    </div>
  )
}

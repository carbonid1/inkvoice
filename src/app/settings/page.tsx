'use client'

import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon'
import { useVoices } from '@/lib/hooks/useVoices/useVoices'
import { getVoiceFallback } from '@/lib/services/voice/helpers/getVoiceFallback/getVoiceFallback'
import { useVoiceStore } from '@/store/useVoiceStore'
import Link from 'next/link'
import { useEffect } from 'react'
import { CreditsCard } from './components/CreditsCard/CreditsCard'
import { PlaybackCard } from './components/PlaybackCard/PlaybackCard'
import { VoiceManagerCard } from './components/VoiceManagerCard/VoiceManagerCard'

export default function Settings() {
  const { voices, loading, refetch } = useVoices()
  const voice = useVoiceStore(s => s.voice)
  const setVoice = useVoiceStore(s => s.setVoice)

  // Auto-correct stale global voice when voice list loads
  useEffect(() => {
    if (loading || voices.length === 0) return
    const voiceNames = voices.map(v => v.name)
    const fallback = getVoiceFallback(voice, voiceNames)
    if (fallback !== voice) setVoice(fallback)
  }, [loading, voices, voice, setVoice])

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Back to library"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto space-y-6">
        <VoiceManagerCard voices={voices} loading={loading} onVoicesChanged={refetch} />
        <PlaybackCard />
        <CreditsCard />
      </main>
    </div>
  )
}

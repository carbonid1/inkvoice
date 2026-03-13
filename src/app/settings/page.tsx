'use client'

import { PageHeader } from '@/components/PageHeader/PageHeader'
import { useVoices } from '@/lib/hooks/useVoices/useVoices'
import { getVoiceFallback } from '@/lib/services/voice/helpers/getVoiceFallback/getVoiceFallback'
import { useVoiceStore } from '@/store/useVoiceStore'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { AppearanceCard } from './components/AppearanceCard/AppearanceCard'
import { CreditsCard } from './components/CreditsCard/CreditsCard'
import { VoiceManagerCard } from './components/VoiceManagerCard/VoiceManagerCard'

export default function Settings() {
  const { voices, loading, refetch } = useVoices()
  const voice = useVoiceStore(s => s.voice)
  const setVoice = useVoiceStore(s => s.setVoice)

  // Load voice preferences from API on mount
  useEffect(() => {
    useVoiceStore.getState().loadAll()
  }, [])

  // Auto-correct stale global voice when voice list loads
  useEffect(() => {
    if (loading || voices.length === 0) return
    const voiceNames = voices.map(v => v.name)
    const fallback = getVoiceFallback(voice, voiceNames)
    if (fallback !== voice) setVoice(fallback)
  }, [loading, voices, voice, setVoice])

  return (
    <div className="min-h-screen">
      <PageHeader>
        <div className="max-w-2xl mx-auto px-8 py-6 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-accent transition-colors"
            title="Back to library"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
      </PageHeader>

      <main className="max-w-2xl mx-auto px-8 py-8 space-y-6">
        <VoiceManagerCard voices={voices} loading={loading} onVoicesChanged={refetch} />
        <AppearanceCard />
        <CreditsCard />
      </main>
    </div>
  )
}

'use client'

import { buttonVariants, Tooltip } from '@carbonid1/design-system'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { useVoices } from '@/lib/hooks/useVoices/useVoices'
import { getVoiceFallback } from '@/lib/services/voice/helpers/getVoiceFallback/getVoiceFallback'
import { useVoiceStore } from '@/store/useVoiceStore'
import { AppearanceCard } from './components/AppearanceCard/AppearanceCard'
import { CreditsCard } from './components/CreditsCard/CreditsCard'
import { StorageCard } from './components/StorageCard/StorageCard'
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
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-2">
          <Tooltip label="Back to Library" position="bottom">
            <Link
              href="/"
              className={buttonVariants({ size: 'icon' })}
              aria-label="Back to Library"
            >
              <ChevronLeft />
            </Link>
          </Tooltip>
          <h1 className="font-semibold">Settings</h1>
        </div>
      </PageHeader>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <VoiceManagerCard voices={voices} loading={loading} onVoicesChanged={refetch} />
        <StorageCard />
        <AppearanceCard />
        <CreditsCard />
      </main>
    </div>
  )
}

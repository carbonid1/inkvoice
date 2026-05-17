'use client'

import { useMemo } from 'react'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { usePregenStore } from '@/store/usePregenStore'
import { useVoiceStore } from '@/store/useVoiceStore'
import { deriveOnboarding } from './helpers/deriveOnboarding/deriveOnboarding'

export const useOnboardingDerivation = () => {
  const loaded = useOnboardingStore(s => s.loaded)
  const dismissed = useOnboardingStore(s => s.dismissed)
  const manuallyCompleted = useOnboardingStore(s => s.manuallyCompleted)
  const voice = useVoiceStore(s => s.voice)
  const jobCount = usePregenStore(s => Object.keys(s.jobs).length)

  return useMemo(
    () => deriveOnboarding({ loaded, voice, jobCount, dismissed, manuallyCompleted }),
    [loaded, voice, jobCount, dismissed, manuallyCompleted],
  )
}

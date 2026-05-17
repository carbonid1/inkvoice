import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import type { OnboardingStepId } from '@/store/useOnboardingStore'

interface DeriveOnboardingInput {
  loaded: boolean
  voice: string
  jobCount: number
  dismissed: boolean
  manuallyCompleted: Record<OnboardingStepId, boolean>
}

interface DeriveOnboardingResult {
  done: ReadonlySet<OnboardingStepId>
  total: number
  visible: boolean
}

const TOTAL_STEPS = 2

export const deriveOnboarding = ({
  loaded,
  voice,
  jobCount,
  dismissed,
  manuallyCompleted,
}: DeriveOnboardingInput): DeriveOnboardingResult => {
  const done = new Set<OnboardingStepId>()

  if (manuallyCompleted.voice || voice !== DEFAULT_VOICE) done.add('voice')
  if (manuallyCompleted.pregen || jobCount > 0) done.add('pregen')

  const visible = loaded && !dismissed && done.size < TOTAL_STEPS

  return { done, total: TOTAL_STEPS, visible }
}

import type { OnboardingStepId } from '@/store/useOnboardingStore'

export interface StepDefinition {
  id: OnboardingStepId
  title: string
  description: string
}

export const STEP_DEFINITIONS: ReadonlyArray<StepDefinition> = [
  {
    id: 'voice',
    title: 'Pick or create a voice',
    description: 'Use a bundled voice, upload your own, or design one with AI.',
  },
  {
    id: 'pregen',
    title: 'Pre-generate for smooth playback',
    description: 'Generates audio in the background — come back when it’s ready.',
  },
]

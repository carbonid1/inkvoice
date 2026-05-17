import type { APIRequestContext } from '@playwright/test'

export const cleanupOnboarding = async (request: APIRequestContext) => {
  await Promise.all([
    request.delete('/api/settings/onboarding.dismissed'),
    request.delete('/api/settings/onboarding.manuallyCompleted'),
    request.delete('/api/voice-preferences/__global__'),
  ])
}

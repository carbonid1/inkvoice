import { toast } from '@carbonid1/design-system'
import { formatBytes } from '@/lib/helpers/formatBytes/formatBytes'
import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import { usePregenStore } from '@/store/usePregenStore'

interface StartPosition {
  chapter: number
  paragraph: number
}

export const startPregeneration = async (
  bookId: string,
  startPosition?: StartPosition,
): Promise<PregenJob | null> => {
  const query = startPosition
    ? `?startChapter=${startPosition.chapter}&startParagraph=${startPosition.paragraph}`
    : ''
  const response = await fetch(`/api/pregenerate/${bookId}${query}`, { method: 'POST' })

  if (response.ok) {
    const newJob: PregenJob = await response.json()

    usePregenStore.getState().updateJob(newJob)
    // Open the panel here — the one path both generation triggers (onboarding
    // panel, book context menu) share — so neither caller has to remember to.
    usePregenStore.getState().setPanelOpen(true)
    return newJob
  }

  if (response.status === 409) {
    const body = await response.json().catch(() => ({}))
    const shortfall = body?.budget?.shortfallBytes

    if (body?.budget?.ok === false && typeof shortfall === 'number') {
      toast('Cache full', {
        description: `Free ${formatBytes(shortfall)} in Settings or raise the cache limit.`,
      })
    }
  }

  return null
}

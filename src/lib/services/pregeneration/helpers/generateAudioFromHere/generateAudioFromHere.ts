import { toast } from '@carbonid1/design-system'
import type { PregenJob } from '@/lib/services/pregenQueue/pregenQueue.types'
import { startPregeneration } from '@/lib/services/pregeneration/helpers/startPregeneration/startPregeneration'
import { usePregenStore } from '@/store/usePregenStore'

/**
 * Points audio generation at the reader's position: repositions the book's
 * active pregen job there, or starts a new job from that position when none
 * is active. Returns the resulting job, or null when the request failed
 * (e.g. over budget — startPregeneration already toasts that case).
 */
export const generateAudioFromHere = async (
  bookId: string,
  chapter: number,
  paragraph: number,
): Promise<PregenJob | null> => {
  const response = await fetch(`/api/pregenerate/${bookId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reposition', chapter, paragraph }),
  })

  if (response.ok) {
    const job: PregenJob = await response.json()

    usePregenStore.getState().updateJob(job)
    return job
  }

  if (response.status === 404) {
    return startPregeneration(bookId, { chapter, paragraph })
  }

  toast('Could not start generating from here', { description: 'Try again in a moment.' })
  return null
}

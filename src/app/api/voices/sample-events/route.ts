import { makeSSEResponse } from '@/lib/helpers/sseResponse/sseResponse'
import { voiceSampleEvents } from '@/lib/services/voiceSampleEvents/voiceSampleEvents.service'
import type { VoiceSampleEventListener } from '@/lib/services/voiceSampleEvents/voiceSampleEvents.types'

export const dynamic = 'force-dynamic'

export const GET = () => {
  return makeSSEResponse(enqueue => {
    // Replay any cached outcomes so a panel reopened after the sample landed
    // still receives the result without a HEAD fallback.
    for (const event of voiceSampleEvents.getRecent()) {
      enqueue.event('sample', event)
    }

    const listener: VoiceSampleEventListener = event => {
      enqueue.event('sample', event)
    }

    voiceSampleEvents.on(listener)
    return () => voiceSampleEvents.off(listener)
  })
}

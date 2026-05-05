import { getPythonClient } from '@/lib/services/pythonClient/pythonClient'
import { voiceSampleEvents } from '@/lib/services/voiceSampleEvents/voiceSampleEvents.service'
import { voiceService } from '../../voice.service'

const TTS_TIMEOUT_MS = 300_000

export const generateAndSaveSample = async (voiceName: string, text: string): Promise<void> => {
  const response = await getPythonClient().fetch('/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: voiceName }),
    signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`TTS API returned ${response.status}`)

  const arrayBuffer = await response.arrayBuffer()

  await voiceService.saveSample(voiceName, Buffer.from(arrayBuffer))
  voiceSampleEvents.publish(voiceName, 'ready')
  console.warn(`Generated sample for voice "${voiceName}"`)
}

import { env } from '@/lib/config/env'
import { parseTimestampsHeader } from '@/lib/helpers/parseTimestampsHeader/parseTimestampsHeader'
import type { TTSService } from './tts.types'
import { TTSError } from './tts.types'

const TTS_TIMEOUT_MS = 90_000

class ChatterboxTTSService implements TTSService {
  async generate(text: string, voice: string) {
    const response = await fetch(env.ttsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
      signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 400 && errorText.toLowerCase().includes('not found')) {
        throw new TTSError('VOICE_NOT_FOUND', errorText, 400)
      }
      throw new TTSError('TTS_FAILED', errorText, response.status)
    }

    const generationTimeMs = parseInt(response.headers.get('X-Generation-Time-Ms') || '0', 10)
    const timestamps = parseTimestampsHeader(response)
    const audioBuffer = await response.arrayBuffer()

    return { audio: Buffer.from(audioBuffer), generationTimeMs, timestamps }
  }
}

let _ttsService: TTSService | null = null

export const getTTSService = (): TTSService => {
  if (!_ttsService) {
    _ttsService = new ChatterboxTTSService()
  }
  return _ttsService
}

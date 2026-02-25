import { env } from '@/lib/config/env'
import type { TTSService } from './tts.types'

const TTS_TIMEOUT_MS = 90_000

class ChatterboxTTSService implements TTSService {
  async generate(
    text: string,
    voice: string,
  ): Promise<{ audio: Buffer; generationTimeMs: number }> {
    const response = await fetch(env.ttsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
      signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`TTS API error: ${error}`)
    }

    const generationTimeMs = parseInt(response.headers.get('X-Generation-Time-Ms') || '0', 10)
    const audioBuffer = await response.arrayBuffer()

    return { audio: Buffer.from(audioBuffer), generationTimeMs }
  }
}

let _ttsService: TTSService | null = null

export const getTTSService = (): TTSService => {
  if (!_ttsService) {
    _ttsService = new ChatterboxTTSService()
  }
  return _ttsService
}

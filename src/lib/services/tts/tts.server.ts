import { env } from '@/lib/config/env'
import type { TTSService } from './tts.types'

class TTSServerService implements TTSService {
  async generate(
    text: string,
    voice: string,
    exaggeration = 0.7
  ): Promise<{ audio: Buffer; generationTimeMs: number }> {
    const response = await fetch(env.ttsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, exaggeration }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`TTS API error: ${error}`)
    }

    const generationTimeMs = parseInt(
      response.headers.get('X-Generation-Time-Ms') || '0',
      10
    )

    const audioBuffer = await response.arrayBuffer()
    return {
      audio: Buffer.from(audioBuffer),
      generationTimeMs,
    }
  }
}

// Singleton instance
let _ttsService: TTSService | null = null

export const getTTSService = (): TTSService => {
  if (!_ttsService) {
    _ttsService = new TTSServerService()
  }
  return _ttsService
}

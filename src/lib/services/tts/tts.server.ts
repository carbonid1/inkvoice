import { env } from '@/lib/config/env'
import { performance } from 'perf_hooks'
import type { TTSModel, TTSService } from './tts.types'

type PythonModel = 'turbo' | 'standard'

const PYTHON_MODEL_MAP: Record<string, PythonModel> = {
  'chatterbox-turbo': 'turbo',
  'chatterbox': 'standard',
}

let kokoroInstance: import('kokoro-js').KokoroTTS | null = null

const getKokoro = async (): Promise<import('kokoro-js').KokoroTTS> => {
  if (!kokoroInstance) {
    const { KokoroTTS } = await import('kokoro-js')
    console.warn('Loading Kokoro TTS model (q8)...')
    kokoroInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q8',
    })
    console.warn('Kokoro TTS model loaded')
  }
  return kokoroInstance
}

class MultiModelTTSService implements TTSService {
  async generate(
    text: string,
    voice: string,
    model: TTSModel,
  ): Promise<{ audio: Buffer; generationTimeMs: number }> {
    if (model === 'kokoro') {
      return this.generateKokoro(text, voice)
    }
    return this.generateChatterbox(text, voice, model)
  }

  private async generateChatterbox(
    text: string,
    voice: string,
    model: TTSModel,
  ): Promise<{ audio: Buffer; generationTimeMs: number }> {
    const pythonModel = PYTHON_MODEL_MAP[model] ?? 'turbo'

    const response = await fetch(env.ttsApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, model: pythonModel }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`TTS API error: ${error}`)
    }

    const generationTimeMs = parseInt(response.headers.get('X-Generation-Time-Ms') || '0', 10)
    const audioBuffer = await response.arrayBuffer()

    return { audio: Buffer.from(audioBuffer), generationTimeMs }
  }

  private async generateKokoro(
    text: string,
    voice: string,
  ): Promise<{ audio: Buffer; generationTimeMs: number }> {
    const tts = await getKokoro()
    const voiceId = voice in tts.voices ? voice : 'af_heart'

    const start = performance.now()
    const rawAudio = await tts.generate(text, {
      voice: voiceId as keyof typeof tts.voices,
    })
    const generationTimeMs = Math.round(performance.now() - start)

    return { audio: Buffer.from(rawAudio.toWav()), generationTimeMs }
  }
}

let _ttsService: TTSService | null = null

export const getTTSService = (): TTSService => {
  if (!_ttsService) {
    _ttsService = new MultiModelTTSService()
  }
  return _ttsService
}

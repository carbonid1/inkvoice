export interface TTSService {
  generate(text: string, voice: string): Promise<{ audio: Buffer; generationTimeMs: number }>
}

export type TTSErrorCode = 'VOICE_NOT_FOUND' | 'TTS_FAILED'

export class TTSError extends Error {
  constructor(
    public readonly code: TTSErrorCode,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'TTSError'
  }
}

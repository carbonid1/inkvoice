export type TTSModel = 'chatterbox-turbo' | 'chatterbox' | 'kokoro'

export interface TTSService {
  generate(
    text: string,
    voice: string,
    model: TTSModel,
  ): Promise<{ audio: Buffer; generationTimeMs: number }>
}

export interface TTSService {
  generate(text: string, voice: string): Promise<{ audio: Buffer; generationTimeMs: number }>
}

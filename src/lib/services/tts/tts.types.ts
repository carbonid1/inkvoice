export interface TTSService {
  /** Generate audio for text (server-side, calls Python API) */
  generate(
    text: string,
    voice: string,
    exaggeration?: number
  ): Promise<{ audio: Buffer; generationTimeMs: number }>
}

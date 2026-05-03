export type VoiceType = 'app' | 'custom'

export interface VoiceEntry {
  name: string
  displayName: string
  type: VoiceType
  hasSample: boolean
  tags: string[]
}

export interface VoiceMetadata {
  displayName: string
  tags: string[]
}

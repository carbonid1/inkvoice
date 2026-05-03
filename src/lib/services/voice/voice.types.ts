export type VoiceType = 'app' | 'custom'

export type VoiceSource = 'upload' | 'design'

export interface VoiceEntry {
  name: string
  displayName: string
  type: VoiceType
  source: VoiceSource
  hasSample: boolean
  tags: string[]
}

export interface VoiceMetadata {
  displayName: string
  source: VoiceSource
  tags: string[]
}

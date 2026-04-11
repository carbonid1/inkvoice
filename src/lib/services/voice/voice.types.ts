export type VoiceType = 'app' | 'custom'

export type VoiceEntry = {
  name: string
  displayName: string
  type: VoiceType
  hasSample: boolean
  tags: string[]
}

export type VoiceMetadata = {
  displayName: string
  tags: string[]
  language?: string
}

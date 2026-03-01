export type VoiceType = 'app' | 'custom'

export type VoiceEntry = {
  name: string
  displayName: string
  type: VoiceType
  hasSample: boolean
}

export type VoiceMetadata = {
  displayName: string
}

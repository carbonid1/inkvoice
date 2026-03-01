export type AudioType = 'source' | 'sample'

export type PlayingState = {
  name: string
  type: AudioType
} | null

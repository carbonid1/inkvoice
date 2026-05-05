export type VoiceSampleStatus = 'ready' | 'failed'

export interface VoiceSampleEvent {
  type: 'sample'
  voiceName: string
  status: VoiceSampleStatus
}

export type VoiceSampleEventListener = (event: VoiceSampleEvent) => void

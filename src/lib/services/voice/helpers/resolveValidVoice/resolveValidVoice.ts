import { DEFAULT_VOICE } from '../../voice.consts'
import type { VoiceEntry } from '../../voice.types'

type ResolveValidVoiceResult = {
  voice: string
  fellBack: boolean
}

type ResolveVoicePath = (name: string) => Promise<string | null>
type ListVoices = () => Promise<VoiceEntry[]>

export const resolveValidVoice = async (
  requestedVoice: string,
  resolveVoicePath: ResolveVoicePath,
  listVoices: ListVoices,
): Promise<ResolveValidVoiceResult> => {
  if (await resolveVoicePath(requestedVoice)) {
    return { voice: requestedVoice, fellBack: false }
  }

  if (await resolveVoicePath(DEFAULT_VOICE)) {
    return { voice: DEFAULT_VOICE, fellBack: true }
  }

  const voices = await listVoices()
  const first = voices[0]
  if (first) {
    return { voice: first.name, fellBack: true }
  }

  throw new Error('No voices available')
}

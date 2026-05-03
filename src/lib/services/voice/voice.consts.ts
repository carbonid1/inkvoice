import type { VoiceMetadata } from './voice.types'

export const DEFAULT_VOICE = 'clara'

export const UNDO_WINDOW_MS = 30_000

const appVoice = (displayName: string, tags: string[]): VoiceMetadata => ({
  displayName,
  source: 'upload',
  tags,
})

export const APP_VOICES: Record<string, VoiceMetadata> = {
  celine: appVoice('Celine', ['american', 'deliberate', 'female']),
  clara: appVoice('Clara', ['british', 'clear', 'female', 'warm']),
  helen: appVoice('Helen', ['american', 'female', 'smooth', 'warm']),
  jonathan: appVoice('Jonathan', ['american', 'deep', 'expressive', 'male']),
  lily: appVoice('Lily', ['american', 'female', 'gentle', 'literary']),
  linda: appVoice('Linda', ['american', 'female', 'formal', 'neutral']),
  maria: appVoice('Maria', ['american', 'clear', 'female', 'measured']),
  miles: appVoice('Miles', ['american', 'authoritative', 'deep', 'male']),
  philip: appVoice('Philip', ['american', 'formal', 'male', 'steady']),
  sylvia: appVoice('Sylvia', ['american', 'female', 'gentle']),
  tony: appVoice('Tony', ['american', 'conversational', 'male']),
}

export const isAppVoice = (name: string): boolean => name in APP_VOICES

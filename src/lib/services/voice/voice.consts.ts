import type { VoiceMetadata } from './voice.types'

export const DEFAULT_VOICE = 'clara'

export const UNDO_WINDOW_MS = 30_000

export const APP_VOICES: Record<string, VoiceMetadata> = {
  celine: { displayName: 'Celine', tags: ['american', 'deliberate', 'female'] },
  clara: { displayName: 'Clara', tags: ['british', 'clear', 'female', 'warm'] },
  helen: { displayName: 'Helen', tags: ['american', 'female', 'smooth', 'warm'] },
  jonathan: { displayName: 'Jonathan', tags: ['american', 'deep', 'expressive', 'male'] },
  lily: { displayName: 'Lily', tags: ['american', 'female', 'gentle', 'literary'] },
  linda: { displayName: 'Linda', tags: ['american', 'female', 'formal', 'neutral'] },
  maria: { displayName: 'Maria', tags: ['american', 'clear', 'female', 'measured'] },
  miles: { displayName: 'Miles', tags: ['american', 'authoritative', 'deep', 'male'] },
  philip: { displayName: 'Philip', tags: ['american', 'formal', 'male', 'steady'] },
  sylvia: { displayName: 'Sylvia', tags: ['american', 'female', 'gentle'] },
  tony: { displayName: 'Tony', tags: ['american', 'conversational', 'male'] },
}

export const isAppVoice = (name: string): boolean => name in APP_VOICES

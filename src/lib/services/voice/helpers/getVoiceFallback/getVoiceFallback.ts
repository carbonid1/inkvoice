import { DEFAULT_VOICE } from '../../voice.consts'

export const getVoiceFallback = (requested: string, available: string[]): string => {
  if (available.length === 0 || available.includes(requested)) return requested
  if (available.includes(DEFAULT_VOICE)) return DEFAULT_VOICE
  return available[0] ?? requested
}

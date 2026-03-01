import type { VoiceEntry } from '@/lib/services/voice/voice.types'

type VoiceOptionGroupsProps = {
  voices: VoiceEntry[]
}

export const VoiceOptionGroups = ({ voices }: VoiceOptionGroupsProps) => {
  const appVoices = voices.filter(v => v.type === 'app')
  const customVoices = voices.filter(v => v.type === 'custom')

  return (
    <>
      {appVoices.length > 0 && (
        <optgroup label="App Voices">
          {appVoices.map(v => (
            <option key={v.name} value={v.name}>
              {v.displayName}
            </option>
          ))}
        </optgroup>
      )}
      {customVoices.length > 0 && (
        <optgroup label="Custom Voices">
          {customVoices.map(v => (
            <option key={v.name} value={v.name}>
              {v.displayName}
            </option>
          ))}
        </optgroup>
      )}
    </>
  )
}

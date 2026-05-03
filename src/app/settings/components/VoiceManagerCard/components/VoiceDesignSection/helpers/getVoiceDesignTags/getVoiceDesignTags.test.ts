import { describe, expect, it } from 'vitest'
import type { AttributeValues } from '../../VoiceDesignSection.consts'
import { getVoiceDesignTags } from './getVoiceDesignTags'

const empty: AttributeValues = { gender: '', age: '', pitch: '', accent: '', style: '' }

describe('getVoiceDesignTags', () => {
  it('returns no tags when nothing is picked', () => {
    expect(getVoiceDesignTags(empty)).toEqual([])
  })

  it('emits gender as-is', () => {
    expect(getVoiceDesignTags({ ...empty, gender: 'female' })).toEqual(['female'])
    expect(getVoiceDesignTags({ ...empty, gender: 'male' })).toEqual(['male'])
  })

  it('kebabs multi-word age values', () => {
    expect(getVoiceDesignTags({ ...empty, age: 'young adult' })).toEqual(['young-adult'])
    expect(getVoiceDesignTags({ ...empty, age: 'middle-aged' })).toEqual(['middle-aged'])
    expect(getVoiceDesignTags({ ...empty, age: 'elderly' })).toEqual(['elderly'])
  })

  it('kebabs pitch extremes', () => {
    expect(getVoiceDesignTags({ ...empty, pitch: 'low pitch' })).toEqual(['low-pitch'])
    expect(getVoiceDesignTags({ ...empty, pitch: 'very high pitch' })).toEqual(['very-high-pitch'])
  })

  it('drops moderate pitch', () => {
    expect(getVoiceDesignTags({ ...empty, pitch: 'moderate pitch' })).toEqual([])
  })

  it('strips the trailing " accent" suffix', () => {
    expect(getVoiceDesignTags({ ...empty, accent: 'british accent' })).toEqual(['british'])
    expect(getVoiceDesignTags({ ...empty, accent: 'american accent' })).toEqual(['american'])
  })

  it('emits style as-is', () => {
    expect(getVoiceDesignTags({ ...empty, style: 'whisper' })).toEqual(['whisper'])
  })

  it('preserves attribute order: gender, age, pitch, accent, style', () => {
    expect(
      getVoiceDesignTags({
        gender: 'female',
        age: 'young adult',
        pitch: 'low pitch',
        accent: 'british accent',
        style: 'whisper',
      }),
    ).toEqual(['female', 'young-adult', 'low-pitch', 'british', 'whisper'])
  })
})

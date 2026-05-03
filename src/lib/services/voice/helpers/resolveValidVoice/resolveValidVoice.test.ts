import { describe, expect, it } from 'vitest'
import type { VoiceEntry } from '../../voice.types'
import { resolveValidVoice } from './resolveValidVoice'

const makeVoices = (...names: string[]): VoiceEntry[] =>
  names.map(name => ({
    name,
    displayName: name,
    type: 'app',
    source: 'upload',
    hasSample: false,
    tags: [],
  }))

const resolveFound =
  (...existing: string[]) =>
  (name: string): Promise<string | null> =>
    Promise.resolve(existing.includes(name) ? `/voices/${name}/source.wav` : null)

describe('resolveValidVoice', () => {
  it('returns requested voice when it exists', async () => {
    const result = await resolveValidVoice('casual', resolveFound('casual', 'narrator'), () =>
      Promise.resolve(makeVoices('casual', 'narrator')),
    )

    expect(result).toEqual({ voice: 'casual', fellBack: false })
  })

  it('falls back to narrator when requested voice is missing', async () => {
    const result = await resolveValidVoice('deleted-voice', resolveFound('narrator'), () =>
      Promise.resolve(makeVoices('narrator')),
    )

    expect(result).toEqual({ voice: 'narrator', fellBack: true })
  })

  it('falls back to first available voice when narrator is also missing', async () => {
    const result = await resolveValidVoice('deleted-voice', resolveFound('announcer'), () =>
      Promise.resolve(makeVoices('announcer', 'casual')),
    )

    expect(result).toEqual({ voice: 'announcer', fellBack: true })
  })

  it('throws when no voices exist at all', async () => {
    await expect(
      resolveValidVoice('deleted-voice', resolveFound(), () => Promise.resolve([])),
    ).rejects.toThrow('No voices available')
  })
})

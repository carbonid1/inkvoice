import { describe, expect, it } from 'vitest'
import type { VoiceEntry } from '../../voice.types'
import { resolveValidVoice } from './resolveValidVoice'

const makeVoices = (...names: string[]): VoiceEntry[] =>
  names.map(name => ({ name, displayName: name, type: 'app', hasSample: false, tags: [] }))

const resolveFound =
  (...existing: string[]) =>
  async (name: string) =>
    existing.includes(name) ? `/voices/${name}/source.wav` : null

describe('resolveValidVoice', () => {
  it('returns requested voice when it exists', async () => {
    const result = await resolveValidVoice('casual', resolveFound('casual', 'narrator'), async () =>
      makeVoices('casual', 'narrator'),
    )

    expect(result).toEqual({ voice: 'casual', fellBack: false })
  })

  it('falls back to narrator when requested voice is missing', async () => {
    const result = await resolveValidVoice('deleted-voice', resolveFound('narrator'), async () =>
      makeVoices('narrator'),
    )

    expect(result).toEqual({ voice: 'narrator', fellBack: true })
  })

  it('falls back to first available voice when narrator is also missing', async () => {
    const result = await resolveValidVoice('deleted-voice', resolveFound('announcer'), async () =>
      makeVoices('announcer', 'casual'),
    )

    expect(result).toEqual({ voice: 'announcer', fellBack: true })
  })

  it('throws when no voices exist at all', async () => {
    await expect(
      resolveValidVoice('deleted-voice', resolveFound(), async () => []),
    ).rejects.toThrow('No voices available')
  })
})

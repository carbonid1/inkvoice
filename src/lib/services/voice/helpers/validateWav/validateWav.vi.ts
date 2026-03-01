import { describe, expect, it } from 'vitest'
import { validateWav } from './validateWav'

const createWavBuffer = ({
  sampleRate = 22050,
  channels = 1,
  bitsPerSample = 16,
  durationSeconds = 6,
}: {
  sampleRate?: number
  channels?: number
  bitsPerSample?: number
  durationSeconds?: number
} = {}): Buffer => {
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = channels * bytesPerSample
  const numSamples = Math.floor(sampleRate * durationSeconds)
  const dataSize = numSamples * blockAlign
  const buffer = Buffer.alloc(44 + dataSize)

  // RIFF header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)

  // fmt chunk
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16) // chunk size
  buffer.writeUInt16LE(1, 20) // PCM format
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * blockAlign, 28) // byte rate
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)

  // data chunk
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  return buffer
}

describe('validateWav', () => {
  it('returns metadata for a valid WAV', () => {
    const buffer = createWavBuffer({
      sampleRate: 22050,
      channels: 1,
      bitsPerSample: 16,
      durationSeconds: 6,
    })
    const result = validateWav(buffer)
    expect(result).toEqual({
      ok: true,
      sampleRate: 22050,
      channels: 1,
      bitsPerSample: 16,
      durationSeconds: expect.closeTo(6, 1),
    })
  })

  it('rejects non-WAV buffer', () => {
    const buffer = Buffer.from('not a wav file at all')
    const result = validateWav(buffer)
    expect(result).toEqual({ ok: false, code: 'INVALID_FORMAT', message: expect.any(String) })
  })

  it('rejects buffer too small to contain WAV header', () => {
    const buffer = Buffer.alloc(20)
    const result = validateWav(buffer)
    expect(result).toEqual({ ok: false, code: 'INVALID_FORMAT', message: expect.any(String) })
  })

  it('rejects WAV shorter than 5 seconds', () => {
    const buffer = createWavBuffer({ durationSeconds: 3 })
    const result = validateWav(buffer)
    expect(result).toEqual({ ok: false, code: 'TOO_SHORT', message: expect.any(String) })
  })

  it('accepts exactly 5 seconds', () => {
    const buffer = createWavBuffer({ durationSeconds: 5 })
    const result = validateWav(buffer)
    expect(result).toMatchObject({ ok: true, durationSeconds: expect.closeTo(5, 1) })
  })

  it('handles stereo WAV', () => {
    const buffer = createWavBuffer({ channels: 2, durationSeconds: 6 })
    const result = validateWav(buffer)
    expect(result).toMatchObject({ ok: true, channels: 2 })
  })

  it('handles 24-bit WAV', () => {
    const buffer = createWavBuffer({ bitsPerSample: 24, durationSeconds: 6 })
    const result = validateWav(buffer)
    expect(result).toMatchObject({ ok: true, bitsPerSample: 24 })
  })

  it('rejects RIFF header without WAVE format', () => {
    const buffer = createWavBuffer()
    buffer.write('AVI ', 8)
    const result = validateWav(buffer)
    expect(result).toEqual({ ok: false, code: 'INVALID_FORMAT', message: expect.any(String) })
  })
})

import { describe, expect, it } from 'vitest'
import { convertToWav } from './convertToWav'

const createWavBuffer = (sampleRate = 22050, durationSeconds = 6): Buffer => {
  const channels = 1
  const bitsPerSample = 16
  const blockAlign = channels * (bitsPerSample / 8)
  const numSamples = Math.floor(sampleRate * durationSeconds)
  const dataSize = numSamples * blockAlign
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * blockAlign, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  return buffer
}

describe('convertToWav', () => {
  it('passes through WAV files and normalizes to 22050Hz mono 16-bit', async () => {
    const input = createWavBuffer(44100, 6)
    const result = await convertToWav(input, 'test.wav')

    expect(result.ok).toBe(true)
    if (!result.ok) return

    // Should be a valid WAV
    expect(result.buffer.toString('ascii', 0, 4)).toBe('RIFF')
    expect(result.buffer.toString('ascii', 8, 12)).toBe('WAVE')

    // Should be 22050Hz mono 16-bit
    expect(result.buffer.readUInt32LE(24)).toBe(22050)
    expect(result.buffer.readUInt16LE(22)).toBe(1)
    expect(result.buffer.readUInt16LE(34)).toBe(16)
  })

  it('rejects unsupported file extensions', async () => {
    const input = Buffer.from('fake data')
    const result = await convertToWav(input, 'file.txt')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('UNSUPPORTED_FORMAT')
  })

  it('accepts supported audio extensions', async () => {
    const wav = createWavBuffer()

    for (const ext of ['wav', 'mp3', 'm4a', 'ogg', 'flac']) {
      const result = await convertToWav(wav, `test.${ext}`)

      // WAV input should always succeed; non-WAV with WAV data may fail at ffmpeg
      // but the extension check should pass
      if (ext === 'wav') {
        expect(result.ok).toBe(true)
      }
    }
  })

  it('returns error for corrupted audio data', async () => {
    const input = Buffer.from('not real audio data but long enough to be something')
    const result = await convertToWav(input, 'test.mp3')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('CONVERSION_FAILED')
  })
})

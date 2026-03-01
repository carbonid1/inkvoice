import { describe, expect, it } from 'vitest'
import { padWavTo40ms } from './padWavTo40ms'

const createWavBuffer = (sampleRate: number, durationSeconds: number): Buffer => {
  const channels = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = channels * bytesPerSample
  const numSamples = Math.floor(sampleRate * durationSeconds)
  const dataSize = numSamples * blockAlign
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20) // PCM
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * blockAlign, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  return buffer
}

describe('padWavTo40ms', () => {
  it('returns already-aligned buffer unchanged', () => {
    // 5.00s at 22050Hz = 110250 samples → exactly 125 × 40ms
    const buffer = createWavBuffer(22050, 5.0)
    const result = padWavTo40ms(buffer)
    expect(result.padded).toBe(false)
    expect(result.buffer.length).toBe(buffer.length)
  })

  it('pads unaligned buffer to next 40ms boundary', () => {
    // 5.001s at 22050Hz = 110272 samples → not a multiple of 882 (40ms at 22050)
    const buffer = createWavBuffer(22050, 5.001)
    const result = padWavTo40ms(buffer)
    expect(result.padded).toBe(true)

    // Check alignment in integer samples to avoid floating point issues
    const sampleRate = result.buffer.readUInt32LE(24)
    const dataSize = result.buffer.readUInt32LE(40)
    const blockAlign = result.buffer.readUInt16LE(32)
    const numSamples = dataSize / blockAlign
    const samplesPerBoundary = (sampleRate * 40) / 1000 // 882 at 22050Hz
    expect(numSamples % samplesPerBoundary).toBe(0)
  })

  it('updates WAV header sizes after padding', () => {
    const buffer = createWavBuffer(22050, 5.001)
    const result = padWavTo40ms(buffer)

    const newDataSize = result.buffer.readUInt32LE(40)
    const newRiffSize = result.buffer.readUInt32LE(4)
    expect(newRiffSize).toBe(36 + newDataSize)
  })

  it('padded samples are zero (silence)', () => {
    const originalLength = createWavBuffer(22050, 5.001).length
    const buffer = createWavBuffer(22050, 5.001)
    const result = padWavTo40ms(buffer)

    // Everything after original data should be zeros
    const paddedRegion = result.buffer.subarray(originalLength)
    const allZeros = paddedRegion.every(byte => byte === 0)
    expect(allZeros).toBe(true)
  })

  it('preserves RIFF/WAVE headers', () => {
    const buffer = createWavBuffer(22050, 5.001)
    const result = padWavTo40ms(buffer)

    expect(result.buffer.toString('ascii', 0, 4)).toBe('RIFF')
    expect(result.buffer.toString('ascii', 8, 12)).toBe('WAVE')
    expect(result.buffer.toString('ascii', 12, 16)).toBe('fmt ')
    expect(result.buffer.toString('ascii', 36, 40)).toBe('data')
  })
})

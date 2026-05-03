import { findWavChunk } from '../findWavChunk/findWavChunk'

export const getWavDurationSeconds = (buffer: Buffer): number | null => {
  if (buffer.length < 12) return null
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null
  if (buffer.toString('ascii', 8, 12) !== 'WAVE') return null

  const fmtOffset = findWavChunk(buffer, 'fmt ')
  const dataOffset = findWavChunk(buffer, 'data')

  if (fmtOffset === -1 || dataOffset === -1) return null

  const channels = buffer.readUInt16LE(fmtOffset + 10)
  const sampleRate = buffer.readUInt32LE(fmtOffset + 12)
  const bitsPerSample = buffer.readUInt16LE(fmtOffset + 22)
  const dataSize = buffer.readUInt32LE(dataOffset + 4)

  const blockAlign = channels * (bitsPerSample / 8)

  if (blockAlign === 0 || sampleRate === 0) return null

  return dataSize / blockAlign / sampleRate
}

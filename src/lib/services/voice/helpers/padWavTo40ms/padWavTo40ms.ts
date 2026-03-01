type PadResult = {
  buffer: Buffer
  padded: boolean
}

import { findWavChunk } from '../findWavChunk/findWavChunk'

const BOUNDARY_MS = 40

export const padWavTo40ms = (wavBuffer: Buffer): PadResult => {
  const fmtOffset = findWavChunk(wavBuffer, 'fmt ')
  const dataOffset = findWavChunk(wavBuffer, 'data')

  const sampleRate = wavBuffer.readUInt32LE(fmtOffset + 12)
  const channels = wavBuffer.readUInt16LE(fmtOffset + 10)
  const bitsPerSample = wavBuffer.readUInt16LE(fmtOffset + 22)
  const dataSize = wavBuffer.readUInt32LE(dataOffset + 4)
  const dataStart = dataOffset + 8

  const blockAlign = channels * (bitsPerSample / 8)
  const numSamples = dataSize / blockAlign
  const samplesPerBoundary = (sampleRate * BOUNDARY_MS) / 1000
  const remainder = numSamples % samplesPerBoundary

  if (remainder === 0) {
    return { buffer: wavBuffer, padded: false }
  }

  const paddingSamples = samplesPerBoundary - remainder
  const paddingBytes = paddingSamples * blockAlign
  const newDataSize = dataSize + paddingBytes
  const newTotalSize = wavBuffer.length + paddingBytes
  const newBuffer = Buffer.alloc(newTotalSize)

  // Copy everything up to end of original data
  wavBuffer.copy(newBuffer, 0, 0, dataStart + dataSize)

  // Copy anything after the data chunk (if present)
  const afterData = dataStart + dataSize
  if (afterData < wavBuffer.length) {
    wavBuffer.copy(newBuffer, dataStart + dataSize + paddingBytes, afterData)
  }

  // Update RIFF size (total file size - 8)
  newBuffer.writeUInt32LE(newTotalSize - 8, 4)

  // Update data chunk size
  newBuffer.writeUInt32LE(newDataSize, dataOffset + 4)

  return { buffer: newBuffer, padded: true }
}

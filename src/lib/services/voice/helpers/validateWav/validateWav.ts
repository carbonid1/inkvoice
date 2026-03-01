type WavMetadata = {
  ok: true
  sampleRate: number
  channels: number
  bitsPerSample: number
  durationSeconds: number
}

type WavError = {
  ok: false
  code: 'INVALID_FORMAT' | 'TOO_SHORT' | 'TOO_LONG'
  message: string
}

export type WavValidationResult = WavMetadata | WavError

import { findWavChunk } from '../findWavChunk/findWavChunk'

const MIN_HEADER_SIZE = 12
const MIN_DURATION_SECONDS = 5
const MAX_DURATION_SECONDS = 30

export const validateWav = (buffer: Buffer): WavValidationResult => {
  if (buffer.length < MIN_HEADER_SIZE) {
    return { ok: false, code: 'INVALID_FORMAT', message: 'File is too small to be a valid WAV' }
  }

  const riff = buffer.toString('ascii', 0, 4)
  const wave = buffer.toString('ascii', 8, 12)

  if (riff !== 'RIFF' || wave !== 'WAVE') {
    return {
      ok: false,
      code: 'INVALID_FORMAT',
      message: 'File is not a valid WAV (missing RIFF/WAVE header)',
    }
  }

  const fmtOffset = findWavChunk(buffer, 'fmt ')
  if (fmtOffset === -1) {
    return { ok: false, code: 'INVALID_FORMAT', message: 'WAV file missing fmt chunk' }
  }

  const dataOffset = findWavChunk(buffer, 'data')
  if (dataOffset === -1) {
    return { ok: false, code: 'INVALID_FORMAT', message: 'WAV file missing data chunk' }
  }

  const channels = buffer.readUInt16LE(fmtOffset + 10)
  const sampleRate = buffer.readUInt32LE(fmtOffset + 12)
  const bitsPerSample = buffer.readUInt16LE(fmtOffset + 22)
  const dataSize = buffer.readUInt32LE(dataOffset + 4)

  const bytesPerSample = bitsPerSample / 8
  const blockAlign = channels * bytesPerSample
  const numSamples = dataSize / blockAlign
  const durationSeconds = numSamples / sampleRate

  if (durationSeconds < MIN_DURATION_SECONDS) {
    return {
      ok: false,
      code: 'TOO_SHORT',
      message: `Voice reference must be at least ${MIN_DURATION_SECONDS} seconds (got ${durationSeconds.toFixed(1)}s)`,
    }
  }

  if (durationSeconds > MAX_DURATION_SECONDS) {
    return {
      ok: false,
      code: 'TOO_LONG',
      message: `Voice reference must be at most ${MAX_DURATION_SECONDS} seconds (got ${durationSeconds.toFixed(1)}s)`,
    }
  }

  return { ok: true, sampleRate, channels, bitsPerSample, durationSeconds }
}

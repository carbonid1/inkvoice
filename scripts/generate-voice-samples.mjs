#!/usr/bin/env node

/**
 * Generate voice sample WAV files for all Kokoro English voices.
 * Stores output in data/voices/{voiceId}/sample.wav
 */

import { KokoroTTS } from 'kokoro-js'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const SAMPLE_TEXT =
  'Night gathers, and now my watch begins. It shall not end until my death. ' +
  'I shall take no wife, hold no lands, father no children.'

const VOICES = [
  'af_heart', 'af_bella', 'af_nicole', 'bf_emma',
  'af_aoede', 'af_kore', 'af_sarah',
  'am_fenrir', 'am_michael', 'am_puck',
  'af_alloy', 'af_nova', 'bf_isabella', 'bm_george', 'bm_fable',
  'af_sky', 'af_jessica', 'af_river',
  'am_echo', 'am_eric', 'am_liam', 'am_onyx',
  'bf_alice', 'bf_lily', 'bm_daniel', 'bm_lewis',
  'am_adam', 'am_santa',
]

const outDir = join(process.cwd(), 'data', 'voices')

console.log('Loading Kokoro TTS model (q8)...')
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8' })
console.log('Model loaded. Generating samples for', VOICES.length, 'voices...\n')

for (const voice of VOICES) {
  const dir = join(outDir, voice)
  mkdirSync(dir, { recursive: true })

  const start = performance.now()
  const audio = await tts.generate(SAMPLE_TEXT, { voice })
  const ms = Math.round(performance.now() - start)

  const wavPath = join(dir, 'sample.wav')
  writeFileSync(wavPath, Buffer.from(audio.toWav()))
  console.log(`  ${voice} — ${ms}ms`)
}

console.log('\nDone!')
process.exit(0)

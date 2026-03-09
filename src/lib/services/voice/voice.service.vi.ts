import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createVoiceService } from './voice.service'

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

describe('voiceService', () => {
  let voicesDir: string

  beforeEach(async () => {
    voicesDir = await fs.mkdtemp(path.join(os.tmpdir(), 'voices-'))

    // Create an app voice
    const narratorDir = path.join(voicesDir, 'narrator')
    await fs.mkdir(narratorDir)
    await fs.writeFile(path.join(narratorDir, 'source.wav'), createWavBuffer())
    await fs.writeFile(path.join(narratorDir, 'sample.wav'), Buffer.alloc(100))

    // Create another app voice without sample
    const casualDir = path.join(voicesDir, 'casual')
    await fs.mkdir(casualDir)
    await fs.writeFile(path.join(casualDir, 'source.wav'), createWavBuffer())

    // Create custom dir with one voice
    const customDir = path.join(voicesDir, 'custom', 'my-voice')
    await fs.mkdir(customDir, { recursive: true })
    await fs.writeFile(path.join(customDir, 'source.wav'), createWavBuffer())
    await fs.writeFile(
      path.join(customDir, 'metadata.json'),
      JSON.stringify({ displayName: 'My Voice' }),
    )
  })

  afterEach(async () => {
    await fs.rm(voicesDir, { recursive: true })
  })

  it('lists app voices with type "app"', async () => {
    const service = createVoiceService(voicesDir)
    const voices = await service.listVoices()
    const appVoices = voices.filter(v => v.type === 'app')

    expect(appVoices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'narrator', type: 'app', hasSample: true }),
        expect.objectContaining({ name: 'casual', type: 'app', hasSample: false }),
      ]),
    )
  })

  it('lists custom voices with type "custom"', async () => {
    const service = createVoiceService(voicesDir)
    const voices = await service.listVoices()
    const customVoices = voices.filter(v => v.type === 'custom')

    expect(customVoices).toEqual([
      expect.objectContaining({ name: 'my-voice', type: 'custom', displayName: 'My Voice' }),
    ])
  })

  it('prettifies app voice display names from slug', async () => {
    const service = createVoiceService(voicesDir)
    const voices = await service.listVoices()
    const narrator = voices.find(v => v.name === 'narrator')
    expect(narrator?.displayName).toBe('Narrator')
  })

  it('sorts voices alphabetically within each type, app first', async () => {
    const service = createVoiceService(voicesDir)
    const voices = await service.listVoices()
    const types = voices.map(v => v.type)
    const appEnd = types.lastIndexOf('app')
    const customStart = types.indexOf('custom')

    if (customStart !== -1) {
      expect(appEnd).toBeLessThan(customStart)
    }
  })

  it('uploads a voice with WAV file', async () => {
    const service = createVoiceService(voicesDir)
    const wavBuffer = createWavBuffer(22050, 6)
    const result = await service.uploadVoice('New Voice', wavBuffer, 'recording.wav')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.name).toBe('new-voice')
    expect(result.displayName).toBe('New Voice')

    // Verify file was saved
    const sourcePath = path.join(voicesDir, 'custom', 'new-voice', 'source.wav')
    const stat = await fs.stat(sourcePath)
    expect(stat.isFile()).toBe(true)

    // Verify metadata was saved
    const metaPath = path.join(voicesDir, 'custom', 'new-voice', 'metadata.json')
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'))
    expect(meta.displayName).toBe('New Voice')
  })

  it('rejects upload with too-short audio', async () => {
    const service = createVoiceService(voicesDir)
    const shortWav = createWavBuffer(22050, 3)
    const result = await service.uploadVoice('Short Voice', shortWav, 'short.wav')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('TOO_SHORT')
  })

  it('rejects upload with duplicate name', async () => {
    const service = createVoiceService(voicesDir)
    const wav = createWavBuffer()
    const result = await service.uploadVoice('My Voice', wav, 'test.wav')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('NAME_TAKEN')
  })

  it('rejects upload that collides with app voice name', async () => {
    const service = createVoiceService(voicesDir)
    const wav = createWavBuffer()
    const result = await service.uploadVoice('Narrator', wav, 'test.wav')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('NAME_TAKEN')
  })

  it('soft-deletes a custom voice by renaming with _deleted suffix', async () => {
    const service = createVoiceService(voicesDir)
    const result = await service.deleteVoice('my-voice')
    expect(result).toEqual({ ok: true })

    // Original dir should be gone
    const original = await fs.stat(path.join(voicesDir, 'custom', 'my-voice')).catch(() => null)
    expect(original).toBeNull()

    // _deleted dir should exist with files intact
    const deleted = await fs.stat(path.join(voicesDir, 'custom', 'my-voice_deleted'))
    expect(deleted.isDirectory()).toBe(true)
    const source = await fs.stat(path.join(voicesDir, 'custom', 'my-voice_deleted', 'source.wav'))
    expect(source.isFile()).toBe(true)
  })

  it('clears stale _deleted dir before soft-deleting', async () => {
    const service = createVoiceService(voicesDir)

    // Create a stale _deleted dir with old content
    const staleDir = path.join(voicesDir, 'custom', 'my-voice_deleted')
    await fs.mkdir(staleDir, { recursive: true })
    await fs.writeFile(path.join(staleDir, 'source.wav'), Buffer.alloc(10))
    await fs.writeFile(path.join(staleDir, 'old-file.txt'), 'stale')

    const result = await service.deleteVoice('my-voice')
    expect(result).toEqual({ ok: true })

    // _deleted dir should have current files, not stale ones
    const deletedDir = path.join(voicesDir, 'custom', 'my-voice_deleted')
    const files = await fs.readdir(deletedDir)
    expect(files).toContain('source.wav')
    expect(files).toContain('metadata.json')
    expect(files).not.toContain('old-file.txt')
  })

  it('refuses to delete an app voice', async () => {
    const service = createVoiceService(voicesDir)
    const result = await service.deleteVoice('narrator')
    expect(result).toEqual({ ok: false, reason: 'app_voice' })

    // Verify not deleted
    const fileStat = await fs.stat(path.join(voicesDir, 'narrator', 'source.wav'))
    expect(fileStat.isFile()).toBe(true)
  })

  it('returns not_found when deleting non-existent voice', async () => {
    const service = createVoiceService(voicesDir)
    const result = await service.deleteVoice('does-not-exist')
    expect(result).toEqual({ ok: false, reason: 'not_found' })
  })

  it('restores a soft-deleted voice', async () => {
    const service = createVoiceService(voicesDir)
    await service.deleteVoice('my-voice')
    const result = await service.restoreVoice('my-voice')
    expect(result).toEqual({ ok: true })

    // Original dir restored
    const restored = await fs.stat(path.join(voicesDir, 'custom', 'my-voice'))
    expect(restored.isDirectory()).toBe(true)

    // _deleted dir gone
    const deleted = await fs
      .stat(path.join(voicesDir, 'custom', 'my-voice_deleted'))
      .catch(() => null)
    expect(deleted).toBeNull()

    // Shows up in listing again
    const voices = await service.listVoices()
    expect(voices.map(v => v.name)).toContain('my-voice')
  })

  it('returns not_found when restoring a non-deleted voice', async () => {
    const service = createVoiceService(voicesDir)
    const result = await service.restoreVoice('does-not-exist')
    expect(result).toEqual({ ok: false, reason: 'not_found' })
  })

  it('excludes soft-deleted voices from listing', async () => {
    const service = createVoiceService(voicesDir)
    await service.deleteVoice('my-voice')
    const voices = await service.listVoices()
    const names = voices.map(v => v.name)
    expect(names).not.toContain('my-voice')
    expect(names).not.toContain('my-voice_deleted')
  })

  it('resolves voice path for app voice', async () => {
    const service = createVoiceService(voicesDir)
    const voicePath = await service.resolveVoicePath('narrator')
    expect(voicePath).toBe(path.join(voicesDir, 'narrator', 'source.wav'))
  })

  it('resolves voice path for custom voice', async () => {
    const service = createVoiceService(voicesDir)
    const voicePath = await service.resolveVoicePath('my-voice')
    expect(voicePath).toBe(path.join(voicesDir, 'custom', 'my-voice', 'source.wav'))
  })

  it('returns null for non-existent voice path', async () => {
    const service = createVoiceService(voicesDir)
    const voicePath = await service.resolveVoicePath('nope')
    expect(voicePath).toBeNull()
  })
})

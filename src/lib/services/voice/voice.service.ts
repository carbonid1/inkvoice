import { env } from '@/lib/config/env'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises'
import path from 'path'
import { convertToWav } from './helpers/convertToWav/convertToWav'
import { padWavTo40ms } from './helpers/padWavTo40ms/padWavTo40ms'
import { prettifyVoiceName } from './helpers/prettifyVoiceName/prettifyVoiceName'
import { slugifyVoiceName } from './helpers/slugifyVoiceName/slugifyVoiceName'
import { validateVoiceName } from './helpers/validateVoiceName/validateVoiceName'
import { validateWav } from './helpers/validateWav/validateWav'
import type { VoiceEntry, VoiceMetadata } from './voice.types'

type UploadSuccess = {
  ok: true
  name: string
  displayName: string
  durationSeconds: number
  padded: boolean
}

type UploadError = {
  ok: false
  code: string
  message: string
}

type UploadResult = UploadSuccess | UploadError

type DeleteResult = { ok: true } | { ok: false; reason: 'not_found' | 'app_voice' }

const fileExists = async (filePath: string): Promise<boolean> =>
  stat(filePath)
    .then(s => s.isFile())
    .catch(() => false)

const dirExists = async (dirPath: string): Promise<boolean> =>
  stat(dirPath)
    .then(s => s.isDirectory())
    .catch(() => false)

const readDirSafe = async (dirPath: string): Promise<string[]> => readdir(dirPath).catch(() => [])

export const createVoiceService = (voicesDir: string) => {
  const customDir = path.join(voicesDir, 'custom')

  const listAppVoices = async (): Promise<VoiceEntry[]> => {
    const entries = await readDirSafe(voicesDir)
    const voices: VoiceEntry[] = []

    for (const entry of entries) {
      if (entry === 'custom') continue
      const entryPath = path.join(voicesDir, entry)
      if (!(await dirExists(entryPath))) continue
      if (!(await fileExists(path.join(entryPath, 'source.wav')))) continue

      const hasSample = await fileExists(path.join(entryPath, 'sample.wav'))
      voices.push({
        name: entry,
        displayName: prettifyVoiceName(entry),
        type: 'app',
        hasSample,
      })
    }

    return voices.sort((a, b) => a.name.localeCompare(b.name))
  }

  const listCustomVoices = async (): Promise<VoiceEntry[]> => {
    const entries = await readDirSafe(customDir)
    const voices: VoiceEntry[] = []

    for (const entry of entries) {
      const entryPath = path.join(customDir, entry)
      if (!(await dirExists(entryPath))) continue
      if (!(await fileExists(path.join(entryPath, 'source.wav')))) continue

      const hasSample = await fileExists(path.join(entryPath, 'sample.wav'))
      let displayName = prettifyVoiceName(entry)

      const metaPath = path.join(entryPath, 'metadata.json')
      try {
        const meta: VoiceMetadata = JSON.parse(await readFile(metaPath, 'utf-8'))
        displayName = meta.displayName
      } catch {
        // No metadata, use prettified slug
      }

      voices.push({ name: entry, displayName, type: 'custom', hasSample })
    }

    return voices.sort((a, b) => a.name.localeCompare(b.name))
  }

  const listVoices = async (): Promise<VoiceEntry[]> => {
    const [appVoices, customVoices] = await Promise.all([listAppVoices(), listCustomVoices()])
    return [...appVoices, ...customVoices]
  }

  const voiceNameExists = async (slug: string): Promise<boolean> => {
    const appPath = path.join(voicesDir, slug)
    if (await dirExists(appPath)) return true

    const customPath = path.join(customDir, slug)
    if (await dirExists(customPath)) return true

    return false
  }

  const uploadVoice = async (
    displayName: string,
    audioBuffer: Buffer,
    originalFilename: string,
  ): Promise<UploadResult> => {
    const slug = slugifyVoiceName(displayName)
    const exists = await voiceNameExists(slug)
    const nameError = validateVoiceName(slug, exists ? [slug] : [])

    if (nameError) {
      const code = nameError.includes('already exists') ? 'NAME_TAKEN' : 'INVALID_NAME'
      return { ok: false, code, message: nameError }
    }

    // Convert to standard WAV format
    const convertResult = await convertToWav(audioBuffer, originalFilename)
    if (!convertResult.ok) {
      return { ok: false, code: convertResult.code, message: convertResult.message }
    }

    // Validate WAV
    const wavResult = validateWav(convertResult.buffer)
    if (!wavResult.ok) {
      return { ok: false, code: wavResult.code, message: wavResult.message }
    }

    // Pad to 40ms boundary
    const padResult = padWavTo40ms(convertResult.buffer)

    // Save files
    const voiceDir = path.join(customDir, slug)
    await mkdir(voiceDir, { recursive: true })
    await writeFile(path.join(voiceDir, 'source.wav'), padResult.buffer)

    const metadata: VoiceMetadata = { displayName }
    await writeFile(path.join(voiceDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

    return {
      ok: true,
      name: slug,
      displayName,
      durationSeconds: wavResult.durationSeconds,
      padded: padResult.padded,
    }
  }

  const deleteVoice = async (name: string): Promise<DeleteResult> => {
    const customPath = path.join(customDir, name)
    if (await dirExists(customPath)) {
      await rm(customPath, { recursive: true })
      return { ok: true }
    }

    const appPath = path.join(voicesDir, name)
    if (await dirExists(appPath)) {
      return { ok: false, reason: 'app_voice' }
    }

    return { ok: false, reason: 'not_found' }
  }

  const resolveVoicePath = async (name: string): Promise<string | null> => {
    const appPath = path.join(voicesDir, name, 'source.wav')
    if (await fileExists(appPath)) return appPath

    const customPath = path.join(customDir, name, 'source.wav')
    if (await fileExists(customPath)) return customPath

    return null
  }

  const resolveSamplePath = async (name: string): Promise<string | null> => {
    const appPath = path.join(voicesDir, name, 'sample.wav')
    if (await fileExists(appPath)) return appPath

    const customPath = path.join(customDir, name, 'sample.wav')
    if (await fileExists(customPath)) return customPath

    return null
  }

  const saveSample = async (name: string, buffer: Buffer): Promise<void> => {
    const samplePath = path.join(customDir, name, 'sample.wav')
    await writeFile(samplePath, buffer)
  }

  return { listVoices, uploadVoice, deleteVoice, resolveVoicePath, resolveSamplePath, saveSample }
}

export const voiceService = createVoiceService(env.voicesDir)

import { env } from '@/lib/config/env'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises'
import path from 'path'
import { convertToWav } from './helpers/convertToWav/convertToWav'
import { normalizeTags } from './helpers/normalizeTags/normalizeTags'
import { padWavTo40ms } from './helpers/padWavTo40ms/padWavTo40ms'
import { prettifyVoiceName } from './helpers/prettifyVoiceName/prettifyVoiceName'
import { slugifyVoiceName } from './helpers/slugifyVoiceName/slugifyVoiceName'
import { validateVoiceName } from './helpers/validateVoiceName/validateVoiceName'
import { validateWav } from './helpers/validateWav/validateWav'
import type { VoiceEntry, VoiceMetadata, VoiceType } from './voice.types'

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

type UpdateTagsResult = { ok: true; tags: string[] } | { ok: false; reason: 'not_found' }

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

  const readMetadata = async (dirPath: string): Promise<Partial<VoiceMetadata> | null> => {
    const metaPath = path.join(dirPath, 'metadata.json')
    try {
      const raw = JSON.parse(await readFile(metaPath, 'utf-8'))
      return {
        displayName: typeof raw.displayName === 'string' ? raw.displayName : undefined,
        tags: Array.isArray(raw.tags)
          ? raw.tags.filter((t: unknown) => typeof t === 'string')
          : undefined,
      }
    } catch {
      return null
    }
  }

  const writeMetadata = async (dirPath: string, meta: VoiceMetadata): Promise<void> => {
    await writeFile(path.join(dirPath, 'metadata.json'), JSON.stringify(meta, null, 2))
  }

  const listVoicesInDir = async (
    dir: string,
    type: VoiceType,
    skip?: string[],
  ): Promise<VoiceEntry[]> => {
    const entries = await readDirSafe(dir)
    const results = await Promise.all(
      entries
        .filter(entry => !skip?.includes(entry))
        .map(async entry => {
          const entryPath = path.join(dir, entry)
          if (!(await fileExists(path.join(entryPath, 'source.wav')))) return null

          const [hasSample, meta] = await Promise.all([
            fileExists(path.join(entryPath, 'sample.wav')),
            readMetadata(entryPath),
          ])

          return {
            name: entry,
            displayName: meta?.displayName ?? prettifyVoiceName(entry),
            type,
            hasSample,
            tags: meta?.tags ?? [],
          } satisfies VoiceEntry
        }),
    )

    return results
      .filter((v): v is VoiceEntry => v !== null)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const listVoices = async (): Promise<VoiceEntry[]> => {
    const [appVoices, customVoices] = await Promise.all([
      listVoicesInDir(voicesDir, 'app', ['custom']),
      listVoicesInDir(customDir, 'custom'),
    ])
    return [...appVoices, ...customVoices]
  }

  const resolveVoiceDir = async (name: string): Promise<string | null> => {
    const appPath = path.join(voicesDir, name)
    if (name !== 'custom' && (await dirExists(appPath))) return appPath

    const customPath = path.join(customDir, name)
    if (await dirExists(customPath)) return customPath

    return null
  }

  const voiceNameExists = async (slug: string): Promise<boolean> =>
    (await resolveVoiceDir(slug)) !== null

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
    await writeMetadata(voiceDir, { displayName, tags: [] })

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

  const updateVoiceTags = async (name: string, tags: string[]): Promise<UpdateTagsResult> => {
    const voiceDir = await resolveVoiceDir(name)
    if (!voiceDir) return { ok: false, reason: 'not_found' }

    const meta = await readMetadata(voiceDir)
    const normalized = normalizeTags(tags)
    await writeMetadata(voiceDir, {
      displayName: meta?.displayName ?? prettifyVoiceName(name),
      tags: normalized,
    })

    return { ok: true, tags: normalized }
  }

  return {
    listVoices,
    uploadVoice,
    deleteVoice,
    resolveVoicePath,
    resolveSamplePath,
    saveSample,
    updateVoiceTags,
  }
}

export const voiceService = createVoiceService(env.voicesDir)

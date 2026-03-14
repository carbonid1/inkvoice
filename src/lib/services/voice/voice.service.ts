import { env } from '@/lib/config/env'
import { mkdir, readdir, rename, rm, stat, writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '../db/db.service'
import { convertToWav } from './helpers/convertToWav/convertToWav'
import { normalizeTags } from './helpers/normalizeTags/normalizeTags'
import { padWavTo40ms } from './helpers/padWavTo40ms/padWavTo40ms'
import { prettifyVoiceName } from './helpers/prettifyVoiceName/prettifyVoiceName'
import { slugifyVoiceName } from './helpers/slugifyVoiceName/slugifyVoiceName'
import { validateVoiceName } from './helpers/validateVoiceName/validateVoiceName'
import { validateWav } from './helpers/validateWav/validateWav'
import { APP_VOICES, isAppVoice } from './voice.consts'
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

type RestoreResult = { ok: true } | { ok: false; reason: 'not_found' }

type UpdateTagsResult =
  | { ok: true; tags: string[] }
  | { ok: false; reason: 'not_found' | 'app_voice' }

const fileExists = async (filePath: string): Promise<boolean> =>
  stat(filePath)
    .then(s => s.isFile())
    .catch(() => false)

const dirExists = async (dirPath: string): Promise<boolean> =>
  stat(dirPath)
    .then(s => s.isDirectory())
    .catch(() => false)

const readDirSafe = async (dirPath: string): Promise<string[]> => readdir(dirPath).catch(() => [])

const isEnoent = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT'

// TODO: Replace _deleted suffix with database soft-delete flag
const DELETED_SUFFIX = '_deleted'

export const createVoiceService = (voicesDir: string) => {
  const customDir = path.join(voicesDir, 'custom')

  const getMetadata = async (name: string): Promise<VoiceMetadata | null> => {
    const row = await prisma.voiceMetadata.findUnique({ where: { name } })
    if (!row) return null
    return {
      displayName: row.displayName,
      tags: JSON.parse(row.tags) as string[],
    }
  }

  const upsertMetadata = async (
    name: string,
    type: VoiceType,
    meta: VoiceMetadata,
  ): Promise<void> => {
    await prisma.voiceMetadata.upsert({
      where: { name },
      create: {
        name,
        displayName: meta.displayName,
        type,
        tags: JSON.stringify(meta.tags),
      },
      update: {
        displayName: meta.displayName,
        tags: JSON.stringify(meta.tags),
      },
    })
  }

  const listVoicesInDir = async (
    dir: string,
    type: VoiceType,
    skip?: string[],
  ): Promise<VoiceEntry[]> => {
    const entries = await readDirSafe(dir)
    const results = await Promise.all(
      entries
        .filter(entry => !entry.endsWith(DELETED_SUFFIX))
        .filter(entry => !skip?.includes(entry))
        .map(async entry => {
          const entryPath = path.join(dir, entry)
          if (!(await fileExists(path.join(entryPath, 'source.wav')))) return null

          const [hasSample, meta] = await Promise.all([
            fileExists(path.join(entryPath, 'sample.wav')),
            type === 'app' ? Promise.resolve(APP_VOICES[entry] ?? null) : getMetadata(entry),
          ])

          const displayName = meta?.displayName ?? prettifyVoiceName(entry)
          const tags = meta?.tags ?? []

          return {
            name: entry,
            displayName,
            type,
            hasSample,
            tags,
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

    // Save metadata to DB
    await upsertMetadata(slug, 'custom', { displayName, tags: [] })

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
    try {
      await rm(customPath + DELETED_SUFFIX, { recursive: true, force: true })
      await rename(customPath, customPath + DELETED_SUFFIX)
      return { ok: true }
    } catch (error) {
      if (!isEnoent(error)) throw error
    }

    const appPath = path.join(voicesDir, name)
    if (await dirExists(appPath)) {
      return { ok: false, reason: 'app_voice' }
    }

    return { ok: false, reason: 'not_found' }
  }

  const restoreVoice = async (name: string): Promise<RestoreResult> => {
    try {
      await rename(path.join(customDir, name + DELETED_SUFFIX), path.join(customDir, name))
      return { ok: true }
    } catch (error) {
      if (!isEnoent(error)) throw error
      return { ok: false, reason: 'not_found' }
    }
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
    if (isAppVoice(name)) return { ok: false, reason: 'app_voice' }

    const voiceDir = await resolveVoiceDir(name)
    if (!voiceDir) return { ok: false, reason: 'not_found' }

    const normalized = normalizeTags(tags)
    const dbMeta = await getMetadata(name)

    await upsertMetadata(name, 'custom', {
      displayName: dbMeta?.displayName ?? prettifyVoiceName(name),
      tags: normalized,
    })

    return { ok: true, tags: normalized }
  }

  return {
    listVoices,
    uploadVoice,
    deleteVoice,
    restoreVoice,
    resolveVoicePath,
    resolveSamplePath,
    saveSample,
    updateVoiceTags,
  }
}

export const voiceService = createVoiceService(env.voicesDir)

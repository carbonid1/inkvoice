import { mkdir, readdir, rename, rm, stat, writeFile } from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import { env } from '@/lib/config/env'
import { getPythonClient } from '@/lib/services/pythonClient/pythonClient'
import { swallowRecordNotFound } from '../../helpers/swallowRecordNotFound/swallowRecordNotFound'
import { prisma } from '../db/db.service'
import { convertToWav } from './helpers/convertToWav/convertToWav'
import { normalizeTags } from './helpers/normalizeTags/normalizeTags'
import { prettifyVoiceName } from './helpers/prettifyVoiceName/prettifyVoiceName'
import { slugifyVoiceName } from './helpers/slugifyVoiceName/slugifyVoiceName'
import { validateVoiceName } from './helpers/validateVoiceName/validateVoiceName'
import { validateWav } from './helpers/validateWav/validateWav'
import { APP_VOICES, isAppVoice } from './voice.consts'
import type { VoiceEntry, VoiceMetadata, VoiceType } from './voice.types'

interface UploadSuccess {
  ok: true
  name: string
  displayName: string
  durationSeconds: number
  transcription: string | null
}

interface UploadError {
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

const fileExists = (filePath: string): Promise<boolean> =>
  stat(filePath)
    .then(s => s.isFile())
    .catch(() => false)

const dirExists = (dirPath: string): Promise<boolean> =>
  stat(dirPath)
    .then(s => s.isDirectory())
    .catch(() => false)

const readDirSafe = (dirPath: string): Promise<string[]> => readdir(dirPath).catch(() => [])

const tagsSchema = z.array(z.string())

export const createVoiceService = (voicesDir: string) => {
  const customDir = path.join(voicesDir, 'custom')

  const getMetadata = async (name: string): Promise<VoiceMetadata | null> => {
    const row = await prisma.voiceMetadata.findUnique({ where: { name } })

    if (!row) return null
    const parsedTags = tagsSchema.safeParse(JSON.parse(row.tags))

    if (!parsedTags.success) {
      console.warn(`[voice] Invalid tags for ${name}: ${parsedTags.error.message}`)
    }
    return {
      displayName: row.displayName,
      tags: parsedTags.success ? parsedTags.data : [],
      language: row.language ?? undefined,
    }
  }

  const upsertMetadata = async (
    name: string,
    type: VoiceType,
    meta: VoiceMetadata,
  ): Promise<void> => {
    const fields = {
      displayName: meta.displayName,
      tags: JSON.stringify(meta.tags),
      language: meta.language ?? null,
    }

    await prisma.voiceMetadata.upsert({
      where: { name },
      create: { name, type, ...fields },
      update: { ...fields, deletedAt: null },
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

  const markVoiceDeleted = async (name: string): Promise<void> => {
    await prisma.voiceMetadata.upsert({
      where: { name },
      create: {
        name,
        displayName: prettifyVoiceName(name),
        type: 'custom',
        tags: '[]',
        deletedAt: Date.now(),
      },
      update: { deletedAt: Date.now() },
    })
  }

  let legacyCleanupPromise: Promise<void> | null = null

  const cleanupLegacyDeletedDirs = (): Promise<void> => {
    if (legacyCleanupPromise) return legacyCleanupPromise
    legacyCleanupPromise = (async () => {
      const entries = await readDirSafe(customDir)
      const legacyDeleted = entries.filter(e => e.endsWith('_deleted'))

      for (const entry of legacyDeleted) {
        const originalName = entry.replace(/_deleted$/, '')
        const deletedPath = path.join(customDir, entry)
        const originalPath = path.join(customDir, originalName)

        await markVoiceDeleted(originalName)

        if (!(await dirExists(originalPath))) {
          await rename(deletedPath, originalPath)
        } else {
          await rm(deletedPath, { recursive: true, force: true })
        }
      }
    })()
    return legacyCleanupPromise
  }

  const getDeletedVoiceNames = async (): Promise<string[]> => {
    const rows = await prisma.voiceMetadata.findMany({
      where: { deletedAt: { not: null } },
      select: { name: true },
    })

    return rows.map(r => r.name)
  }

  const listVoices = async (): Promise<VoiceEntry[]> => {
    await cleanupLegacyDeletedDirs()
    const deletedNames = await getDeletedVoiceNames()
    const [appVoices, customVoices] = await Promise.all([
      listVoicesInDir(voicesDir, 'app', ['custom']),
      listVoicesInDir(customDir, 'custom', deletedNames),
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

  const isDeleted = async (name: string): Promise<boolean> => {
    const row = await prisma.voiceMetadata.findUnique({
      where: { name },
      select: { deletedAt: true },
    })

    return row !== null && row.deletedAt !== null
  }

  const voiceNameExists = async (slug: string): Promise<boolean> => {
    const dir = await resolveVoiceDir(slug)

    if (!dir) return false
    return !(await isDeleted(slug))
  }

  const uploadVoice = async (
    displayName: string,
    audioBuffer: Buffer,
    originalFilename: string,
    language?: string,
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

    // Save files
    const voiceDir = path.join(customDir, slug)

    await mkdir(voiceDir, { recursive: true })
    await writeFile(path.join(voiceDir, 'source.wav'), convertResult.buffer)

    // Save metadata to DB
    await upsertMetadata(slug, 'custom', { displayName, tags: [], language })

    // Transcribe voice reference for OmniVoice
    let transcription: string | null = null

    try {
      const langParam = language ? `?language=${language}` : ''
      const response = await getPythonClient().fetch(`/transcribe${langParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: new Uint8Array(convertResult.buffer),
        signal: AbortSignal.timeout(300_000),
      })

      if (response.ok) {
        const { text } = await response.json()

        if (text) {
          transcription = text
          await writeFile(path.join(voiceDir, 'source.txt'), text)
        }
      }
    } catch {
      // Non-fatal — OmniVoice will auto-transcribe on first use if source.txt is missing
    }

    return {
      ok: true,
      name: slug,
      displayName,
      durationSeconds: wavResult.durationSeconds,
      transcription,
    }
  }

  const deleteVoice = async (name: string): Promise<DeleteResult> => {
    if (isAppVoice(name)) return { ok: false, reason: 'app_voice' }

    const customPath = path.join(customDir, name)

    if (!(await dirExists(customPath))) return { ok: false, reason: 'not_found' }

    await markVoiceDeleted(name)

    return { ok: true }
  }

  const restoreVoice = async (name: string): Promise<RestoreResult> => {
    const row = await prisma.voiceMetadata.findUnique({
      where: { name },
      select: { deletedAt: true },
    })

    if (!row || row.deletedAt === null) return { ok: false, reason: 'not_found' }

    const updated = await swallowRecordNotFound(() =>
      prisma.voiceMetadata.update({
        where: { name },
        data: { deletedAt: null },
      }),
    )

    if (!updated) return { ok: false, reason: 'not_found' }

    return { ok: true }
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
      language: dbMeta?.language,
    })

    return { ok: true, tags: normalized }
  }

  const saveTranscript = async (name: string, text: string): Promise<{ ok: boolean }> => {
    const voiceDir = await resolveVoiceDir(name)

    if (!voiceDir) return { ok: false }
    await writeFile(path.join(voiceDir, 'source.txt'), text.trim())
    return { ok: true }
  }

  return {
    listVoices,
    uploadVoice,
    deleteVoice,
    restoreVoice,
    resolveVoicePath,
    resolveSamplePath,
    saveSample,
    saveTranscript,
    updateVoiceTags,
  }
}

export const voiceService = createVoiceService(env.voicesDir)

import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { env } from '@/lib/config/env'
import { diskSpaceService } from '@/lib/services/platform/diskSpace'
import { SETTINGS_KEYS } from '@/lib/services/settings/settings.keys'
import { settingsService } from '@/lib/services/settings/settings.service'
import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import type { BookCacheStats, CacheStats } from '@/lib/types/api'
import { type WordTimestamp, wordTimestampArraySchema } from '@/lib/types/wordTimestamp'
import type { CacheService } from './cache.types'

const METADATA_FILE = 'metadata.json'
const DISK_SAFETY_MARGIN = 0.1

interface CacheEntry {
  size: number
  createdAt: number
  bookId?: string
  voice?: string
  durationMs?: number
}

interface CacheMetadata {
  totalSize: number
  entries: Record<string, CacheEntry>
}

const getCacheHash = (text: string, voice: string): string => {
  const input = `${text.trim()}|${voice || DEFAULT_VOICE}`

  return createHash('sha256').update(input).digest('hex')
}

class TTSCacheService implements CacheService {
  private metadata: CacheMetadata = { totalSize: 0, entries: {} }
  private initialized = false
  private initPromise: Promise<void> | null = null
  private cacheDir: string
  private effectiveMaxBytes: number

  constructor() {
    this.cacheDir = env.cacheDir
    this.effectiveMaxBytes = env.maxCacheSizeBytes
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this.initialize()
    await this.initPromise
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
      await this.loadMetadata()
      await this.computeEffectiveMax()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize TTS cache:', error)
      this.metadata = { totalSize: 0, entries: {} }
      this.initialized = true
    }
  }

  private async computeEffectiveMax(): Promise<void> {
    let configuredMax = env.maxCacheSizeBytes

    try {
      const savedMB = await settingsService.get(SETTINGS_KEYS.MAX_CACHE_SIZE_MB)

      if (typeof savedMB === 'number' && savedMB > 0) {
        configuredMax = savedMB * 1024 * 1024
      }
    } catch {
      // Settings read failed — use env default
    }

    this.effectiveMaxBytes = await this.clampToDisk(configuredMax)
  }

  private async loadMetadata(): Promise<void> {
    try {
      const metadataPath = path.join(this.cacheDir, METADATA_FILE)
      const data = await fs.readFile(metadataPath, 'utf-8')

      this.metadata = JSON.parse(data)
    } catch {
      this.metadata = { totalSize: 0, entries: {} }
    }
  }

  private async saveMetadata(): Promise<void> {
    try {
      const metadataPath = path.join(this.cacheDir, METADATA_FILE)

      await fs.writeFile(metadataPath, JSON.stringify(this.metadata, null, 2))
    } catch (error) {
      console.error('Failed to save cache metadata:', error)
    }
  }

  async has(text: string, voice: string): Promise<boolean> {
    await this.ensureInitialized()
    const hash = getCacheHash(text, voice)

    return hash in this.metadata.entries
  }

  async getDurationMs(text: string, voice: string): Promise<number> {
    await this.ensureInitialized()
    const hash = getCacheHash(text, voice)

    return this.metadata.entries[hash]?.durationMs ?? 0
  }

  async get(text: string, voice: string): Promise<Buffer | null> {
    await this.ensureInitialized()

    const hash = getCacheHash(text, voice)
    const entry = this.metadata.entries[hash]

    if (!entry) return null

    const filePath = path.join(this.cacheDir, `${hash}.opus`)

    try {
      return await fs.readFile(filePath)
    } catch {
      delete this.metadata.entries[hash]
      this.metadata.totalSize -= entry.size
      this.saveMetadata()
      return null
    }
  }

  async set(
    text: string,
    voice: string,
    audio: Buffer,
    bookId?: string,
    durationMs?: number,
  ): Promise<void> {
    await this.ensureInitialized()

    const hash = getCacheHash(text, voice)
    const filePath = path.join(this.cacheDir, `${hash}.opus`)
    const size = audio.length

    try {
      await fs.writeFile(filePath, audio)

      this.metadata.entries[hash] = {
        size,
        createdAt: Date.now(),
        bookId,
        voice,
        ...(durationMs !== undefined && { durationMs }),
      }
      this.metadata.totalSize += size

      await this.saveMetadata()
    } catch (error) {
      console.error('Failed to write cache file:', error)
    }
  }

  async getStats(): Promise<CacheStats> {
    await this.ensureInitialized()
    return {
      usedBytes: this.metadata.totalSize,
      maxBytes: this.effectiveMaxBytes,
    }
  }

  async getTimestamps(text: string, voice: string): Promise<WordTimestamp[] | null> {
    await this.ensureInitialized()

    const hash = getCacheHash(text, voice)
    const filePath = path.join(this.cacheDir, `${hash}.json`)

    try {
      const data = await fs.readFile(filePath, 'utf-8')
      const parsed = wordTimestampArraySchema.safeParse(JSON.parse(data))

      if (!parsed.success) {
        console.warn(`[cache] Invalid timestamps for ${hash}: ${parsed.error.message}`)
        return null
      }
      return parsed.data
    } catch {
      return null
    }
  }

  async setTimestamps(text: string, voice: string, timestamps: WordTimestamp[]): Promise<void> {
    await this.ensureInitialized()

    const hash = getCacheHash(text, voice)
    const filePath = path.join(this.cacheDir, `${hash}.json`)

    try {
      await fs.writeFile(filePath, JSON.stringify(timestamps))
    } catch (error) {
      console.error('Failed to write timestamps sidecar:', error)
    }
  }

  async delete(text: string, voice: string): Promise<boolean> {
    await this.ensureInitialized()

    const hash = getCacheHash(text, voice)
    const entry = this.metadata.entries[hash]

    if (!entry) return false

    await this.deleteFiles(hash)

    this.metadata.totalSize -= entry.size
    delete this.metadata.entries[hash]
    await this.saveMetadata()
    return true
  }

  private async deleteFiles(hash: string): Promise<void> {
    const audioPath = path.join(this.cacheDir, `${hash}.opus`)
    const jsonPath = path.join(this.cacheDir, `${hash}.json`)

    try {
      await fs.unlink(audioPath)
    } catch {}
    try {
      await fs.unlink(jsonPath)
    } catch {}
  }

  async getBookStats(): Promise<BookCacheStats[]> {
    await this.ensureInitialized()

    const groups: Record<string, { usedBytes: number; entryCount: number }> = {}

    for (const entry of Object.values(this.metadata.entries)) {
      const bookId = entry.bookId ?? 'unknown'
      const group = groups[bookId] ?? { usedBytes: 0, entryCount: 0 }

      group.usedBytes += entry.size
      group.entryCount++
      groups[bookId] = group
    }

    return Object.entries(groups).map(([bookId, stats]) => ({
      bookId,
      ...stats,
    }))
  }

  async countBookVoiceEntries(bookId: string, voice: string): Promise<number> {
    await this.ensureInitialized()
    let count = 0

    for (const entry of Object.values(this.metadata.entries)) {
      if (entry.bookId === bookId && entry.voice === voice) count++
    }
    return count
  }

  async setMaxSizeMB(megabytes: number): Promise<void> {
    await this.ensureInitialized()
    this.effectiveMaxBytes = await this.clampToDisk(megabytes * 1024 * 1024)
    await settingsService.set(SETTINGS_KEYS.MAX_CACHE_SIZE_MB, megabytes)
  }

  async deleteByBookId(bookId: string): Promise<number> {
    await this.ensureInitialized()
    return this.deleteEntriesMatching(entry => entry.bookId === bookId)
  }

  private async deleteEntriesMatching(predicate: (entry: CacheEntry) => boolean): Promise<number> {
    let freed = 0
    const deletions: Promise<void>[] = []

    for (const [hash, entry] of Object.entries(this.metadata.entries)) {
      if (predicate(entry)) {
        deletions.push(this.deleteFiles(hash))
        freed += entry.size
        delete this.metadata.entries[hash]
      }
    }

    await Promise.all(deletions)
    this.metadata.totalSize -= freed
    if (freed > 0) await this.saveMetadata()
    return freed
  }

  private async clampToDisk(requestedBytes: number): Promise<number> {
    try {
      const diskInfo = await diskSpaceService.getAvailableSpace(this.cacheDir)
      const safeAvailable = Math.floor(diskInfo.available * (1 - DISK_SAFETY_MARGIN))

      return Math.min(requestedBytes, safeAvailable)
    } catch {
      return requestedBytes
    }
  }

  async clear(): Promise<void> {
    await this.ensureInitialized()

    await Promise.all(Object.keys(this.metadata.entries).map(hash => this.deleteFiles(hash)))

    this.metadata = { totalSize: 0, entries: {} }
    await this.saveMetadata()
  }
}

// Singleton instance
let _cacheService: CacheService | null = null

export const getCacheService = (): CacheService => {
  if (!_cacheService) {
    _cacheService = new TTSCacheService()
  }
  return _cacheService
}

export const resetCacheService = (): void => {
  _cacheService = null
}

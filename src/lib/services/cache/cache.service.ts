import { env } from '@/lib/config/env'
import type { CacheStats } from '@/lib/types/api'
import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import type { CacheService } from './cache.types'

const METADATA_FILE = 'metadata.json'

interface CacheEntry {
  lastAccess: number
  size: number
  createdAt: number
  bookId?: string
  voice?: string
}

interface CacheMetadata {
  totalSize: number
  entries: Record<string, CacheEntry>
}

const getCacheHash = (text: string, voice: string): string => {
  const input = `${text.trim()}|${voice || 'narrator'}`
  return createHash('sha256').update(input).digest('hex')
}

class TTSCacheService implements CacheService {
  private metadata: CacheMetadata = { totalSize: 0, entries: {} }
  private initialized = false
  private initPromise: Promise<void> | null = null
  private cacheDir: string

  constructor() {
    this.cacheDir = env.cacheDir
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
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize TTS cache:', error)
      this.metadata = { totalSize: 0, entries: {} }
      this.initialized = true
    }
  }

  private async loadMetadata(): Promise<void> {
    try {
      const metadataPath = path.join(this.cacheDir, METADATA_FILE)
      const data = await fs.readFile(metadataPath, 'utf-8')
      this.metadata = JSON.parse(data)
    } catch {
      // No metadata file yet, start fresh
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

  async get(text: string, voice: string): Promise<Buffer | null> {
    await this.ensureInitialized()

    const hash = getCacheHash(text, voice)
    const entry = this.metadata.entries[hash]

    if (!entry) return null

    const filePath = path.join(this.cacheDir, `${hash}.wav`)

    try {
      const buffer = await fs.readFile(filePath)

      // Update last access time
      entry.lastAccess = Date.now()
      // Save metadata asynchronously (don't await)
      this.saveMetadata()

      return buffer
    } catch {
      // File doesn't exist, clean up metadata
      delete this.metadata.entries[hash]
      this.metadata.totalSize -= entry.size
      this.saveMetadata()
      return null
    }
  }

  async set(text: string, voice: string, audio: Buffer, bookId?: string): Promise<void> {
    await this.ensureInitialized()

    const hash = getCacheHash(text, voice)
    const filePath = path.join(this.cacheDir, `${hash}.wav`)
    const size = audio.length

    // Check if we need to evict
    if (this.metadata.totalSize + size > env.maxCacheSizeBytes) {
      await this.evictLRU(size, bookId, voice)
    }

    try {
      await fs.writeFile(filePath, audio)

      this.metadata.entries[hash] = {
        lastAccess: Date.now(),
        size,
        createdAt: Date.now(),
        bookId,
        voice,
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
      maxBytes: env.maxCacheSizeBytes,
    }
  }

  async clear(): Promise<void> {
    await this.ensureInitialized()

    // Delete all cached files
    for (const hash of Object.keys(this.metadata.entries)) {
      const filePath = path.join(this.cacheDir, `${hash}.wav`)
      try {
        await fs.unlink(filePath)
      } catch {
        // Ignore errors for missing files
      }
    }

    this.metadata = { totalSize: 0, entries: {} }
    await this.saveMetadata()
  }

  private async evictLRU(
    bytesNeeded: number,
    activeBookId?: string,
    activeVoice?: string,
  ): Promise<void> {
    const allEntries = Object.entries(this.metadata.entries)

    // Evict other books/voices first, then fall back to active book (all LRU-ordered)
    const isActive = (e: CacheEntry) =>
      activeBookId !== undefined && e.bookId === activeBookId && e.voice === activeVoice
    const other = allEntries
      .filter(([, e]) => !isActive(e))
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess)
    const active = allEntries
      .filter(([, e]) => isActive(e))
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess)
    const evictionOrder = [...other, ...active]

    let freed = 0
    for (const [hash, entry] of evictionOrder) {
      if (freed >= bytesNeeded) break

      const filePath = path.join(this.cacheDir, `${hash}.wav`)
      try {
        await fs.unlink(filePath)
        delete this.metadata.entries[hash]
        freed += entry.size
      } catch {
        // File already gone, just clean up metadata
        delete this.metadata.entries[hash]
        freed += entry.size
      }
    }

    this.metadata.totalSize -= freed
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

import { existsSync } from 'fs'
import { mkdir, writeFile, readFile } from 'fs/promises'
import { dirname } from 'path'
import { getCachePath, getBookCacheDir } from './paths'

export async function getCachedAudio(
  bookId: string,
  chapter: number,
  sentence: number,
  voice?: string
): Promise<Buffer | null> {
  const cachePath = getCachePath(bookId, chapter, sentence, voice)

  if (!existsSync(cachePath)) {
    return null
  }

  return readFile(cachePath)
}

export async function cacheAudio(
  bookId: string,
  chapter: number,
  sentence: number,
  audioData: Buffer,
  voice?: string
): Promise<void> {
  const cachePath = getCachePath(bookId, chapter, sentence, voice)
  const cacheDir = dirname(cachePath)

  await mkdir(cacheDir, { recursive: true })
  await writeFile(cachePath, audioData)
}

export async function ensureCacheDir(bookId: string): Promise<void> {
  const cacheDir = getBookCacheDir(bookId)
  await mkdir(cacheDir, { recursive: true })
}

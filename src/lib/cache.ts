import { existsSync } from 'fs'
import { mkdir, writeFile, readFile } from 'fs/promises'
import { dirname } from 'path'
import { getCachePath, getBookCacheDir } from './paths'

export async function getCachedAudio(
  bookId: string,
  chapter: number,
  sentence: number
): Promise<Buffer | null> {
  const cachePath = getCachePath(bookId, chapter, sentence)

  if (!existsSync(cachePath)) {
    return null
  }

  return readFile(cachePath)
}

export async function cacheAudio(
  bookId: string,
  chapter: number,
  sentence: number,
  audioData: Buffer
): Promise<void> {
  const cachePath = getCachePath(bookId, chapter, sentence)
  const cacheDir = dirname(cachePath)

  await mkdir(cacheDir, { recursive: true })
  await writeFile(cachePath, audioData)
}

export async function ensureCacheDir(bookId: string): Promise<void> {
  const cacheDir = getBookCacheDir(bookId)
  await mkdir(cacheDir, { recursive: true })
}

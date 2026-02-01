import { join } from 'path'
import { homedir } from 'os'

export const BOOKS_DIR = join(process.cwd(), 'data', 'books')
export const CACHE_DIR = join(homedir(), 'Library', 'Caches', 'InkVoice')

export function getCachePath(bookId: string, chapter: number, sentence: number): string {
  return join(CACHE_DIR, bookId, `${chapter}_${sentence}.wav`)
}

export function getBookCacheDir(bookId: string): string {
  return join(CACHE_DIR, bookId)
}

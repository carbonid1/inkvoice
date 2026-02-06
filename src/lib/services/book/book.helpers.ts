import { env } from '@/lib/config/env'
import { existsSync } from 'fs'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Derive a book ID from a filename
 */
export const getBookIdFromFilename = (filename: string): string => {
  return filename.replace('.epub', '').replace(/[^a-zA-Z0-9-_]/g, '_')
}

/**
 * Find an epub file by book ID
 */
export const findBookFile = async (bookId: string): Promise<string | null> => {
  if (!existsSync(env.booksDir)) {
    return null
  }

  const files = await readdir(env.booksDir)
  const epubFile = files.find(f => {
    const fileId = getBookIdFromFilename(f)
    return fileId === bookId
  })

  return epubFile || null
}

/**
 * Read a book file as ArrayBuffer
 */
export const readBookFile = async (filename: string): Promise<ArrayBuffer> => {
  const filePath = join(env.booksDir, filename)
  const buffer = await readFile(filePath)
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer
}

/**
 * List all epub files in the books directory
 */
export const listEpubFiles = async (): Promise<string[]> => {
  if (!existsSync(env.booksDir)) {
    return []
  }
  const files = await readdir(env.booksDir)
  return files.filter(f => f.endsWith('.epub'))
}

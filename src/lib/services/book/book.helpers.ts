import { readdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { env } from '@/lib/config'

/**
 * Derive a book ID from a filename
 */
export function getBookIdFromFilename(filename: string): string {
  return filename.replace('.epub', '').replace(/[^a-zA-Z0-9-_]/g, '_')
}

/**
 * Find an epub file by book ID
 */
export async function findBookFile(bookId: string): Promise<string | null> {
  if (!existsSync(env.booksDir)) {
    return null
  }

  const files = await readdir(env.booksDir)
  const epubFile = files.find((f) => {
    const fileId = getBookIdFromFilename(f)
    return fileId === bookId
  })

  return epubFile || null
}

/**
 * Read a book file as ArrayBuffer
 */
export async function readBookFile(filename: string): Promise<ArrayBuffer> {
  const filePath = join(env.booksDir, filename)
  const buffer = await readFile(filePath)
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer
}

/**
 * List all epub files in the books directory
 */
export async function listEpubFiles(): Promise<string[]> {
  if (!existsSync(env.booksDir)) {
    return []
  }
  const files = await readdir(env.booksDir)
  return files.filter((f) => f.endsWith('.epub'))
}

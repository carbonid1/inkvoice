import { readdir, readFile, rename, writeFile } from 'fs/promises'
import { join } from 'path'
import { env } from '@/lib/config/env'

/**
 * Derive a book ID from a filename
 */
export const getBookIdFromFilename = (filename: string): string => {
  return filename.replace('.epub', '').replace(/[^\p{L}\p{N}_-]/gu, '_')
}

const safeReaddir = async (dir: string): Promise<string[]> => {
  try {
    return await readdir(dir)
  } catch {
    return []
  }
}

/**
 * Find an epub file by book ID
 */
export const findBookFile = async (bookId: string): Promise<string | null> => {
  const files = await safeReaddir(env.booksDir)
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
  const arrayBuffer = new ArrayBuffer(buffer.byteLength)

  new Uint8Array(arrayBuffer).set(buffer)
  return arrayBuffer
}

/**
 * List all epub files in the books directory
 */
export const listEpubFiles = async (): Promise<string[]> => {
  const files = await safeReaddir(env.booksDir)

  return files.filter(f => f.endsWith('.epub'))
}

/**
 * Write a book file to the books directory
 */
export const writeBookFile = async (filename: string, buffer: Buffer): Promise<void> => {
  const filePath = join(env.booksDir, filename)

  await writeFile(filePath, buffer)
}

/**
 * Soft-delete a book file by renaming with _deleted suffix
 */
export const softDeleteBookFile = async (filename: string): Promise<void> => {
  const filePath = join(env.booksDir, filename)

  await rename(filePath, filePath + '_deleted')
}

/**
 * Restore a soft-deleted book file
 */
export const restoreBookFile = async (filename: string): Promise<void> => {
  const filePath = join(env.booksDir, filename)

  await rename(filePath + '_deleted', filePath)
}

/**
 * Find a soft-deleted epub file by book ID
 */
export const findDeletedBookFile = async (bookId: string): Promise<string | null> => {
  const files = await safeReaddir(env.booksDir)
  const deletedFile = files.find(f => {
    if (!f.endsWith('.epub_deleted')) return false
    const original = f.replace(/_deleted$/, '')

    return getBookIdFromFilename(original) === bookId
  })

  return deletedFile ?? null
}

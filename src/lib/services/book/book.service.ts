import { getBookMetadata, getCoverImage, parseEpub } from '@/lib/epub/epub'
import type { Book, BookMetadata, BookOverview, ParsedBook, ParsedChapter } from '@/lib/types/book'
import { prisma } from '../db/db.service'
import {
  findBookFile,
  findDeletedBookFile,
  getBookIdFromFilename,
  listEpubFiles,
  readBookFile,
  restoreBookFile,
  softDeleteBookFile,
  writeBookFile,
} from './book.helpers'
import type { BookService } from './book.types'
import { countWords } from './helpers/countWords/countWords'

/**
 * In-memory book cache to avoid re-parsing EPUBs
 * This is the key optimization - parsing EPUB is expensive
 */
class BookCache {
  private cache = new Map<string, ParsedBook>()
  private maxSize = 5 // Keep at most 5 books in memory

  get(bookId: string): ParsedBook | undefined {
    return this.cache.get(bookId)
  }

  set(bookId: string, book: ParsedBook): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(bookId)) {
      const firstKey = this.cache.keys().next().value

      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(bookId, book)
  }

  evict(bookId: string): void {
    this.cache.delete(bookId)
  }

  clear(): void {
    this.cache.clear()
  }
}

interface BookHeader {
  title: string
  author: string
}

interface BookFullRecord extends BookHeader {
  totalParagraphs: number | null
  totalWords: number | null
}

const computeBookStats = (book: ParsedBook): { totalParagraphs: number; totalWords: number } => {
  let totalParagraphs = 0
  let totalWords = 0

  for (const chapter of book.chapters) {
    totalParagraphs += chapter.paragraphs.length
    for (const paragraph of chapter.paragraphs) {
      totalWords += countWords(paragraph)
    }
  }

  return { totalParagraphs, totalWords }
}

const filenameFallback = (filename: string): BookHeader => ({
  title: filename.replace('.epub', ''),
  author: 'Unknown',
})

// Cheap path used by listBooks discovery. Stats stay null and lazy-fill on the
// first per-book estimate request — avoids parsing every EPUB on bulk import.
const readBookHeader = async (filename: string): Promise<BookHeader> => {
  try {
    const arrayBuffer = await readBookFile(filename)

    return await getBookMetadata(arrayBuffer)
  } catch (e) {
    console.error(`Failed to read header for ${filename}:`, e)
    return filenameFallback(filename)
  }
}

// Full parse used by uploadBook — the user is already waiting on the upload,
// so populating stats here costs nothing extra and saves the lazy-fill round
// trip on first library load.
const parseBookForUpload = async (filename: string, bookId: string): Promise<BookFullRecord> => {
  let arrayBuffer: ArrayBuffer

  try {
    arrayBuffer = await readBookFile(filename)
  } catch (readError) {
    console.error(`Failed to read ${filename}:`, readError)
    return { ...filenameFallback(filename), totalParagraphs: null, totalWords: null }
  }

  try {
    const book = await parseEpub(arrayBuffer, bookId)
    const { totalParagraphs, totalWords } = computeBookStats(book)

    return { title: book.title, author: book.author, totalParagraphs, totalWords }
  } catch (parseError) {
    console.error(`Full parse failed for ${filename}, falling back to header:`, parseError)
    try {
      const meta = await getBookMetadata(arrayBuffer)

      return { ...meta, totalParagraphs: null, totalWords: null }
    } catch (metaError) {
      console.error(`Header fallback failed for ${filename}:`, metaError)
      return { ...filenameFallback(filename), totalParagraphs: null, totalWords: null }
    }
  }
}

class BookServiceImpl implements BookService {
  private cache = new BookCache()

  async listBooks(): Promise<Book[]> {
    const files = await listEpubFiles()
    const fileIds = new Set(files.map(f => getBookIdFromFilename(f)))

    // Get existing DB records
    const dbBooks = await prisma.book.findMany()
    const dbMap = new Map(dbBooks.map(b => [b.id, b]))

    // Find files that need DB insert or re-activation (new or soft-deleted)
    const filesToSync = files.filter(f => {
      const id = getBookIdFromFilename(f)
      const existing = dbMap.get(id)

      return !existing || existing.deletedAt !== null
    })

    if (filesToSync.length > 0) {
      const books = await Promise.all(
        filesToSync.map(async filename => {
          const id = getBookIdFromFilename(filename)
          const header = await readBookHeader(filename)

          return { id, filename, ...header }
        }),
      )

      for (const book of books) {
        await prisma.book.upsert({
          where: { id: book.id },
          create: book,
          update: {
            title: book.title,
            author: book.author,
            filename: book.filename,
            deletedAt: null,
          },
        })
      }
    }

    // Remove DB records for files that no longer exist (skip soft-deleted books)
    const staleIds = dbBooks.filter(b => !fileIds.has(b.id) && b.deletedAt === null).map(b => b.id)

    if (staleIds.length > 0) {
      await prisma.book.deleteMany({ where: { id: { in: staleIds } } })
    }

    // Return active books from DB (now in sync)
    const allBooks = await prisma.book.findMany({
      where: { deletedAt: null },
      orderBy: { title: 'asc' },
    })

    return allBooks.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      filename: b.filename,
    }))
  }

  async getBook(bookId: string): Promise<ParsedBook | null> {
    // Check cache first
    const cached = this.cache.get(bookId)

    if (cached) {
      return cached
    }

    // Find and parse the book
    const filename = await findBookFile(bookId)

    if (!filename) {
      return null
    }

    const arrayBuffer = await readBookFile(filename)
    const book = await parseEpub(arrayBuffer, bookId)

    this.cache.set(bookId, book)

    // Ensure DB row exists so foreign-key-constrained tables (bookmarks, progress) work
    await prisma.book.upsert({
      where: { id: bookId },
      create: { id: bookId, title: book.title, author: book.author, filename },
      update: {},
    })

    return book
  }

  async getBookOverview(bookId: string): Promise<BookOverview | null> {
    const book = await this.getBook(bookId)

    if (!book) return null
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      chapters: book.chapters.map(ch => ({
        title: ch.title,
        paragraphCount: ch.paragraphs.length,
        wordCount: ch.paragraphs.reduce((sum, s) => sum + countWords(s), 0),
      })),
      tocTree: book.tocTree,
    }
  }

  async getBookStats(
    bookId: string,
  ): Promise<{ totalParagraphs: number; totalWords: number } | null> {
    const dbBook = await prisma.book.findUnique({ where: { id: bookId } })

    if (dbBook?.totalParagraphs != null && dbBook?.totalWords != null) {
      return { totalParagraphs: dbBook.totalParagraphs, totalWords: dbBook.totalWords }
    }

    // Lazy fill: parse once and persist. Reuses the in-memory book cache via getBook.
    const book = await this.getBook(bookId)

    if (!book) return null

    const stats = computeBookStats(book)

    await prisma.book.update({ where: { id: bookId }, data: stats })

    return stats
  }

  async getChapter(bookId: string, chapterIndex: number): Promise<ParsedChapter | null> {
    const book = await this.getBook(bookId)

    if (!book) return null
    return book.chapters[chapterIndex] ?? null
  }

  async getParagraph(bookId: string, chapter: number, paragraph: number): Promise<string | null> {
    const book = await this.getBook(bookId)

    if (!book) {
      return null
    }

    const chapterData = book.chapters[chapter]

    if (!chapterData) {
      return null
    }

    return chapterData.paragraphs[paragraph] ?? null
  }

  async getMetadata(bookId: string): Promise<BookMetadata | null> {
    // Check in-memory cache
    const cached = this.cache.get(bookId)

    if (cached) {
      return { title: cached.title, author: cached.author }
    }

    // Check DB
    const dbBook = await prisma.book.findUnique({ where: { id: bookId } })

    if (dbBook) {
      return { title: dbBook.title, author: dbBook.author }
    }

    // Fall back to reading the EPUB header
    const filename = await findBookFile(bookId)

    if (!filename) {
      return null
    }

    try {
      const arrayBuffer = await readBookFile(filename)

      return await getBookMetadata(arrayBuffer)
    } catch (e) {
      console.error(`Failed to read metadata for ${filename}:`, e)
      return { title: filename.replace('.epub', ''), author: 'Unknown' }
    }
  }

  async getCover(bookId: string): Promise<{ data: Buffer; mimeType: string } | null> {
    const filename = await findBookFile(bookId)

    if (!filename) {
      return null
    }

    const arrayBuffer = await readBookFile(filename)

    return getCoverImage(arrayBuffer)
  }

  clearCache(): void {
    this.cache.clear()
  }

  async uploadBook(filename: string, buffer: Buffer): Promise<Book> {
    await writeBookFile(filename, buffer)

    const id = getBookIdFromFilename(filename)
    const record = await parseBookForUpload(filename, id)

    await prisma.book.upsert({
      where: { id },
      create: { id, filename, ...record },
      update: {
        title: record.title,
        author: record.author,
        filename,
        totalParagraphs: record.totalParagraphs,
        totalWords: record.totalWords,
        deletedAt: null,
      },
    })

    return { id, title: record.title, author: record.author, filename }
  }

  async deleteBook(bookId: string): Promise<boolean> {
    const filename = await findBookFile(bookId)

    if (!filename) return false

    await softDeleteBookFile(filename)
    this.cache.evict(bookId)
    await prisma.book.update({ where: { id: bookId }, data: { deletedAt: Date.now() } })
    return true
  }

  async restoreBook(bookId: string): Promise<boolean> {
    const deletedFile = await findDeletedBookFile(bookId)

    if (!deletedFile) return false

    const originalFilename = deletedFile.replace(/_deleted$/, '')

    await restoreBookFile(originalFilename)
    await prisma.book.update({ where: { id: bookId }, data: { deletedAt: null } })

    return true
  }
}

// Singleton instance
let _bookService: BookService | null = null

export const getBookService = (): BookService => {
  if (!_bookService) {
    _bookService = new BookServiceImpl()
  }
  return _bookService
}

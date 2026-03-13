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

const extractMetadataSafe = async (
  filename: string,
): Promise<{ title: string; author: string }> => {
  try {
    const arrayBuffer = await readBookFile(filename)
    return await getBookMetadata(arrayBuffer)
  } catch (e) {
    console.error(`Failed to read metadata for ${filename}:`, e)
    return { title: filename.replace('.epub', ''), author: 'Unknown' }
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

    // Find new files not yet in DB
    const newFiles = files.filter(f => !dbMap.has(getBookIdFromFilename(f)))

    // Insert new books into DB
    if (newFiles.length > 0) {
      const newBooks = await Promise.all(
        newFiles.map(async filename => {
          const id = getBookIdFromFilename(filename)
          const meta = await extractMetadataSafe(filename)
          return { id, title: meta.title, author: meta.author, filename }
        }),
      )

      for (const book of newBooks) {
        await prisma.book.upsert({
          where: { id: book.id },
          create: book,
          update: { title: book.title, author: book.author, filename: book.filename },
        })
      }
    }

    // Remove DB records for deleted files
    const staleIds = dbBooks.filter(b => !fileIds.has(b.id)).map(b => b.id)
    if (staleIds.length > 0) {
      await prisma.book.deleteMany({ where: { id: { in: staleIds } } })
    }

    // Return from DB (now in sync)
    const allBooks = await prisma.book.findMany({ orderBy: { title: 'asc' } })
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

    // Cache for future requests
    this.cache.set(bookId, book)

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

    // Fall back to parsing EPUB
    const filename = await findBookFile(bookId)
    if (!filename) {
      return null
    }

    return extractMetadataSafe(filename)
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
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer

    let title = filename.replace('.epub', '')
    let author = 'Unknown'
    try {
      const metadata = await getBookMetadata(arrayBuffer)
      title = metadata.title
      author = metadata.author
    } catch {
      // Use defaults
    }

    await prisma.book.upsert({
      where: { id },
      create: { id, title, author, filename },
      update: { title, author, filename },
    })

    return { id, title, author, filename }
  }

  async deleteBook(bookId: string): Promise<boolean> {
    const filename = await findBookFile(bookId)
    if (!filename) return false

    await softDeleteBookFile(filename)
    this.cache.evict(bookId)
    await prisma.book.deleteMany({ where: { id: bookId } })
    return true
  }

  async restoreBook(bookId: string): Promise<boolean> {
    const deletedFile = await findDeletedBookFile(bookId)
    if (!deletedFile) return false

    const originalFilename = deletedFile.replace(/_deleted$/, '')
    await restoreBookFile(originalFilename)

    // Re-add to DB
    const meta = await extractMetadataSafe(originalFilename)
    await prisma.book.upsert({
      where: { id: bookId },
      create: { id: bookId, title: meta.title, author: meta.author, filename: originalFilename },
      update: { title: meta.title, author: meta.author, filename: originalFilename },
    })

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

import { getBookMetadata, getCoverImage, parseEpub } from '@/lib/epub/epub'
import type {
  Book,
  BookMetadata,
  BookOverview,
  ChunkingMode,
  ParsedBook,
  ParsedChapter,
} from '@/lib/types/book'
import { findBookFile, getBookIdFromFilename, listEpubFiles, readBookFile } from './book.helpers'
import type { BookService } from './book.types'
import { countWords } from './helpers/countWords/countWords'

/**
 * In-memory book cache to avoid re-parsing EPUBs
 * This is the key optimization - parsing EPUB is expensive
 */
class BookCache {
  private cache = new Map<string, ParsedBook>()
  private maxSize = 5 // Keep at most 5 books in memory

  get(bookId: string, mode: ChunkingMode = 'sentence'): ParsedBook | undefined {
    return this.cache.get(`${bookId}:${mode}`)
  }

  /** Find any cached parse for a book, regardless of chunking mode */
  getAny(bookId: string): ParsedBook | undefined {
    return this.cache.get(`${bookId}:sentence`) ?? this.cache.get(`${bookId}:paragraph`)
  }

  set(bookId: string, mode: ChunkingMode = 'sentence', book: ParsedBook): void {
    const key = `${bookId}:${mode}`
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, book)
  }

  clear(): void {
    this.cache.clear()
  }
}

class BookServiceImpl implements BookService {
  private cache = new BookCache()

  async listBooks(): Promise<Book[]> {
    const files = await listEpubFiles()

    const books = await Promise.all(
      files.map(async filename => {
        const id = getBookIdFromFilename(filename)
        try {
          const arrayBuffer = await readBookFile(filename)
          const metadata = await getBookMetadata(arrayBuffer)
          return {
            id,
            title: metadata.title,
            author: metadata.author,
            filename,
          }
        } catch (e) {
          console.error(`Failed to read metadata for ${filename}:`, e)
          return {
            id,
            title: filename.replace('.epub', ''),
            author: 'Unknown',
            filename,
          }
        }
      }),
    )

    return books
  }

  async getBook(bookId: string, mode: ChunkingMode = 'sentence'): Promise<ParsedBook | null> {
    // Check cache first
    const cached = this.cache.get(bookId, mode)
    if (cached) {
      return cached
    }

    // Find and parse the book
    const filename = await findBookFile(bookId)
    if (!filename) {
      return null
    }

    const arrayBuffer = await readBookFile(filename)
    const book = await parseEpub(arrayBuffer, bookId, mode)

    // Cache for future requests
    this.cache.set(bookId, mode, book)

    return book
  }

  async getBookOverview(
    bookId: string,
    mode: ChunkingMode = 'sentence',
  ): Promise<BookOverview | null> {
    const book = await this.getBook(bookId, mode)
    if (!book) return null
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      chapters: book.chapters.map(ch => ({
        title: ch.title,
        sentenceCount: ch.sentences.length,
        wordCount: ch.sentences.reduce((sum, s) => sum + countWords(s), 0),
      })),
    }
  }

  async getChapter(
    bookId: string,
    chapterIndex: number,
    mode: ChunkingMode = 'sentence',
  ): Promise<ParsedChapter | null> {
    const book = await this.getBook(bookId, mode)
    if (!book) return null
    return book.chapters[chapterIndex] ?? null
  }

  async getSentence(
    bookId: string,
    chapter: number,
    sentence: number,
    mode: ChunkingMode = 'sentence',
  ): Promise<string | null> {
    const book = await this.getBook(bookId, mode)
    if (!book) {
      return null
    }

    const chapterData = book.chapters[chapter]
    if (!chapterData) {
      return null
    }

    return chapterData.sentences[sentence] ?? null
  }

  async getMetadata(bookId: string): Promise<BookMetadata | null> {
    // Check if already cached (can get metadata from cached book)
    const cached = this.cache.getAny(bookId)
    if (cached) {
      return { title: cached.title, author: cached.author }
    }

    const filename = await findBookFile(bookId)
    if (!filename) {
      return null
    }

    const arrayBuffer = await readBookFile(filename)
    return getBookMetadata(arrayBuffer)
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
}

// Singleton instance
let _bookService: BookService | null = null

export const getBookService = (): BookService => {
  if (!_bookService) {
    _bookService = new BookServiceImpl()
  }
  return _bookService
}

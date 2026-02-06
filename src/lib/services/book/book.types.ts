import type {
  Book,
  BookMetadata,
  BookOverview,
  ParsedBook,
  ParsedChapter,
} from '@/lib/types/book'

export interface BookService {
  /** List all available books */
  listBooks(): Promise<Book[]>

  /** Get a parsed book (uses cache to avoid re-parsing) */
  getBook(bookId: string): Promise<ParsedBook | null>

  /** Get book overview with chapter info (no sentence data) */
  getBookOverview(bookId: string): Promise<BookOverview | null>

  /** Get a single parsed chapter */
  getChapter(bookId: string, chapterIndex: number): Promise<ParsedChapter | null>

  /** Get a specific sentence from a book */
  getSentence(bookId: string, chapter: number, sentence: number): Promise<string | null>

  /** Get book metadata only (faster than full parse) */
  getMetadata(bookId: string): Promise<BookMetadata | null>

  /** Get book cover image as base64 data URL */
  getCover(bookId: string): Promise<{ data: Buffer; mimeType: string } | null>

  /** Clear the book cache */
  clearCache(): void
}

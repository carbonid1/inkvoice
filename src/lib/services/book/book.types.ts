import type { Book, BookMetadata, BookOverview, ParsedBook, ParsedChapter } from '@/lib/types/book'

export interface BookService {
  /** List all available books */
  listBooks(): Promise<Book[]>

  /** Get a parsed book (uses cache to avoid re-parsing) */
  getBook(bookId: string): Promise<ParsedBook | null>

  /** Get book overview with chapter info (no paragraph data) */
  getBookOverview(bookId: string): Promise<BookOverview | null>

  /**
   * Get persisted paragraph + word totals. Reads from DB; if not yet computed,
   * parses the EPUB once and persists. Returns null only when the book itself
   * cannot be located. A parse failure persists null stats and returns null
   * so callers can decide whether to surface the book without an estimate.
   */
  getBookStats(
    bookId: string,
  ): Promise<{ totalParagraphs: number; totalWords: number; unspeakableParagraphs: number } | null>

  /** Get a single parsed chapter */
  getChapter(bookId: string, chapterIndex: number): Promise<ParsedChapter | null>

  /** Get a specific paragraph from a book */
  getParagraph(bookId: string, chapter: number, paragraph: number): Promise<string | null>

  /** Get book metadata only (faster than full parse) */
  getMetadata(bookId: string): Promise<BookMetadata | null>

  /** Get book cover image as base64 data URL */
  getCover(bookId: string): Promise<{ data: Buffer; mimeType: string } | null>

  /** Clear the book cache */
  clearCache(): void

  /** Upload a new book file and return its metadata */
  uploadBook(filename: string, buffer: Buffer): Promise<Book>

  /** Soft-delete a book file (rename with _deleted suffix) */
  deleteBook(bookId: string): Promise<boolean>

  /** Restore a soft-deleted book file */
  restoreBook(bookId: string): Promise<boolean>
}

import type {
  Book,
  BookMetadata,
  BookOverview,
  ChunkingMode,
  ParsedBook,
  ParsedChapter,
} from '@/lib/types/book'

export interface BookService {
  /** List all available books */
  listBooks(): Promise<Book[]>

  /** Get a parsed book (uses cache to avoid re-parsing) */
  getBook(bookId: string, mode?: ChunkingMode): Promise<ParsedBook | null>

  /** Get book overview with chapter info (no sentence data) */
  getBookOverview(bookId: string, mode?: ChunkingMode): Promise<BookOverview | null>

  /** Get a single parsed chapter */
  getChapter(
    bookId: string,
    chapterIndex: number,
    mode?: ChunkingMode,
  ): Promise<ParsedChapter | null>

  /** Get a specific sentence from a book */
  getSentence(
    bookId: string,
    chapter: number,
    sentence: number,
    mode?: ChunkingMode,
  ): Promise<string | null>

  /** Get book metadata only (faster than full parse) */
  getMetadata(bookId: string): Promise<BookMetadata | null>

  /** Get book cover image as base64 data URL */
  getCover(bookId: string): Promise<{ data: Buffer; mimeType: string } | null>

  /** Clear the book cache */
  clearCache(): void
}

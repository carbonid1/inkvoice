import type { ParsedBook, BookInfo, BookMetadata } from '@/lib/types/book'

export interface BookService {
  /** List all available books */
  listBooks(): Promise<BookInfo[]>

  /** Get a parsed book (uses cache to avoid re-parsing) */
  getBook(bookId: string): Promise<ParsedBook | null>

  /** Get a specific sentence from a book */
  getSentence(bookId: string, chapter: number, sentence: number): Promise<string | null>

  /** Get book metadata only (faster than full parse) */
  getMetadata(bookId: string): Promise<BookMetadata | null>

  /** Get book cover image as base64 data URL */
  getCover(bookId: string): Promise<{ data: Buffer; mimeType: string } | null>

  /** Clear the book cache */
  clearCache(): void
}

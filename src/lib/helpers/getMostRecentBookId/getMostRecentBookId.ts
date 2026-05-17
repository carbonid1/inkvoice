interface BookLike {
  id: string
}
type ProgressLike = Record<string, { lastReadAt?: number } | undefined>

const lastReadAt = (progress: ProgressLike, id: string) => progress[id]?.lastReadAt ?? 0

export const getMostRecentBookId = (
  books: ReadonlyArray<BookLike>,
  progress: ProgressLike,
): string | null => {
  if (books.length === 0) return null

  return books.reduce((best, book) =>
    lastReadAt(progress, book.id) > lastReadAt(progress, best.id) ? book : best,
  ).id
}

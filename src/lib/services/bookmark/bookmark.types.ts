export type Bookmark = {
  id: string
  chapter: number
  sentence: number
  createdAt: number
  label?: string
  preview?: string
}

export type BookmarkMap = Record<string, Bookmark[]>

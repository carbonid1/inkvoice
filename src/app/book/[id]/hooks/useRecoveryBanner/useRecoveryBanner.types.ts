import type { Bookmark } from '@/lib/services/bookmark/bookmark.types'

export type UseRecoveryBannerParams = {
  bookmarks: Bookmark[]
  currentChapter: number
  currentParagraph: number
}

export type UseRecoveryBannerResult = {
  recoveryBookmark: Bookmark | undefined
  showBanner: boolean
  dismissBanner: () => void
}

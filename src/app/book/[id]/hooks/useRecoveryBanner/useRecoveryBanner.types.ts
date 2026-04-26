import type { Bookmark } from '@/lib/services/bookmark/bookmark.types'

export interface UseRecoveryBannerParams {
  bookmarks: Bookmark[]
  currentChapter: number
  currentParagraph: number
}

export interface UseRecoveryBannerResult {
  recoveryBookmark: Bookmark | undefined
  showBanner: boolean
  dismissBanner: () => void
}

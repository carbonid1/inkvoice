'use client'

import { useCallback, useMemo, useState } from 'react'
import type { UseRecoveryBannerParams, UseRecoveryBannerResult } from './useRecoveryBanner.types'

export const useRecoveryBanner = ({
  bookmarks,
  currentChapter,
  currentParagraph,
}: UseRecoveryBannerParams): UseRecoveryBannerResult => {
  const [dismissed, setDismissed] = useState(false)

  const recoveryBookmark = useMemo(
    () =>
      bookmarks.length > 0
        ? bookmarks.reduce((furthest, b) =>
            b.chapter > furthest.chapter ||
            (b.chapter === furthest.chapter && b.paragraph > furthest.paragraph)
              ? b
              : furthest,
          )
        : undefined,
    [bookmarks],
  )

  const showBanner =
    !dismissed &&
    recoveryBookmark !== undefined &&
    (recoveryBookmark.chapter !== currentChapter || recoveryBookmark.paragraph !== currentParagraph)

  const dismissBanner = useCallback(() => {
    setDismissed(true)
  }, [])

  return useMemo(
    () => ({ recoveryBookmark, showBanner, dismissBanner }),
    [recoveryBookmark, showBanner, dismissBanner],
  )
}

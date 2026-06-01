'use client'

import { useCallback, useMemo, useState } from 'react'
import type { BookPosition } from '@/lib/types/book'
import type { UseRecoveryBannerParams, UseRecoveryBannerResult } from './useRecoveryBanner.types'

const isAhead = (a: BookPosition, b: BookPosition) =>
  a.chapter > b.chapter || (a.chapter === b.chapter && a.paragraph > b.paragraph)

export const useRecoveryBanner = ({
  bookmarks,
  currentChapter,
  currentParagraph,
}: UseRecoveryBannerParams): UseRecoveryBannerResult => {
  const [dismissed, setDismissed] = useState(false)

  const recoveryBookmark = useMemo(
    () =>
      bookmarks.length > 0
        ? bookmarks.reduce((furthest, b) => (isAhead(b, furthest) ? b : furthest))
        : undefined,
    [bookmarks],
  )

  const showBanner =
    !dismissed &&
    recoveryBookmark !== undefined &&
    isAhead(recoveryBookmark, { chapter: currentChapter, paragraph: currentParagraph })

  const dismissBanner = useCallback(() => {
    setDismissed(true)
  }, [])

  return useMemo(
    () => ({ recoveryBookmark, showBanner, dismissBanner }),
    [recoveryBookmark, showBanner, dismissBanner],
  )
}

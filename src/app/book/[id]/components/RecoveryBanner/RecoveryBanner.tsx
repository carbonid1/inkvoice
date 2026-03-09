'use client'

import { X } from 'lucide-react'
import { useState } from 'react'

type RecoveryBannerProps = {
  chapterName: string
  sentence: number
  onNavigate: () => void
}

export const RecoveryBanner = ({ chapterName, sentence, onNavigate }: RecoveryBannerProps) => {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mx-6 mt-4 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
      <p className="text-sm text-amber-800 dark:text-amber-200">
        You have a bookmark at {chapterName}, Paragraph {sentence + 1}.{' '}
        <button
          onClick={onNavigate}
          className="text-amber-700 dark:text-amber-300 underline hover:text-amber-900 dark:hover:text-amber-100 font-medium"
        >
          Go there
        </button>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="p-2 text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0 ml-2"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
